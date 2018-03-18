// load external modules
import { EventEmitter } from "events";
import { CoapClient as coap, CoapResponse, ConnectionResult, RequestMethod } from "node-coap-client";

// load internal modules
import { Accessory, AccessoryTypes } from "./lib/accessory";
import { except } from "./lib/array-extensions";
import { createDeferredPromise, DeferredPromise } from "./lib/defer-promise";
import { endpoints as coapEndpoints } from "./lib/endpoints";
import { Group, GroupInfo, GroupOperation } from "./lib/group";
import { IPSOObject, IPSOOptions } from "./lib/ipsoObject";
import { LightOperation } from "./lib/light";
import { log, LoggerFunction, setCustomLogger } from "./lib/logger";
import { composeObject, entries } from "./lib/object-polyfill";
import { OperationProvider } from "./lib/operation-provider";
import { wait } from "./lib/promises";
import { Scene } from "./lib/scene";
import { TradfriError, TradfriErrorCodes } from "./lib/tradfri-error";
import { ConnectionEvents, ConnectionWatcher, ConnectionWatcherOptions, PingFailedCallback, ReconnectingCallback } from "./lib/watcher";

export type ObserveResourceCallback = (resp: CoapResponse) => void;
export type ObserveDevicesCallback = (addedDevices: Accessory[], removedDevices: Accessory[]) => void;

export type DeviceUpdatedCallback = (device: Accessory) => void;
export type DeviceRemovedCallback = (instanceId: number) => void;
export type GroupUpdatedCallback = (group: Group) => void;
export type GroupRemovedCallback = (instanceId: number) => void;
export type SceneUpdatedCallback = (groupId: number, scene: Scene) => void;
export type SceneRemovedCallback = (groupId: number, instanceId: number) => void;
export type ErrorCallback = (e: Error) => void;
export type ConnectionFailedCallback = (attempt: number, maxAttempts: number) => void;

export type ObservableEvents =
	"device updated" |
	"device removed" |
	"group updated" |
	"group removed" |
	"scene updated" |
	"scene removed" |
	"error" |
	"connection failed"
	;

// tslint:disable:unified-signatures
export interface TradfriClient {
	// default events
	on(event: "device updated", callback: DeviceUpdatedCallback): this;
	on(event: "device removed", callback: DeviceRemovedCallback): this;
	on(event: "group updated", callback: GroupUpdatedCallback): this;
	on(event: "group removed", callback: GroupRemovedCallback): this;
	on(event: "scene updated", callback: SceneUpdatedCallback): this;
	on(event: "scene removed", callback: SceneRemovedCallback): this;
	on(event: "error", callback: ErrorCallback): this;
	// connection events => is there a nicer way than copy & paste?
	on(event: "ping succeeded", callback: () => void): this;
	on(event: "ping failed", callback: PingFailedCallback): this;
	on(event: "connection alive", callback: () => void): this;
	on(event: "connection failed", callback: ConnectionFailedCallback): this;
	on(event: "connection lost", callback: () => void): this;
	on(event: "gateway offline", callback: () => void): this;
	on(event: "reconnecting", callback: ReconnectingCallback): this;
	on(event: "give up", callback: () => void): this;

	removeListener(event: "device updated", callback: DeviceUpdatedCallback): this;
	removeListener(event: "device removed", callback: DeviceRemovedCallback): this;
	removeListener(event: "group updated", callback: GroupUpdatedCallback): this;
	removeListener(event: "group removed", callback: GroupRemovedCallback): this;
	removeListener(event: "scene updated", callback: SceneUpdatedCallback): this;
	removeListener(event: "scene removed", callback: SceneRemovedCallback): this;
	removeListener(event: "error", callback: ErrorCallback): this;
	// connection events => is there a nicer way than copy & paste?
	removeListener(event: "ping succeeded", callback: () => void): this;
	removeListener(event: "ping failed", callback: PingFailedCallback): this;
	removeListener(event: "connection alive", callback: () => void): this;
	removeListener(event: "connection failed", callback: ConnectionFailedCallback): this;
	removeListener(event: "connection lost", callback: () => void): this;
	removeListener(event: "gateway offline", callback: () => void): this;
	removeListener(event: "reconnecting", callback: ReconnectingCallback): this;
	removeListener(event: "give up", callback: () => void): this;

	removeAllListeners(event?: ObservableEvents | ConnectionEvents): this;
}
// tslint:enable:unified-signatures

export interface TradfriOptions {
	/** Callback for a custom logger function. */
	customLogger: LoggerFunction;
	/** Whether to use raw CoAP values or the simplified scale */
	useRawCoAPValues: boolean;
	/** Whether the connection should be automatically watched */
	watchConnection: boolean | Partial<ConnectionWatcherOptions>;
}

export class TradfriClient extends EventEmitter implements OperationProvider {

	/** dictionary of CoAP observers */
	public observedPaths: string[] = [];
	/** dictionary of known devices */
	public devices: Record<string, Accessory> = {};
	/** dictionary of known groups */
	public groups: Record<string, GroupInfo> = {};

	/** Base URL for all CoAP requests */
	private requestBase: string;

	/** Options regarding IPSO objects and serialization */
	private ipsoOptions: IPSOOptions = {};

	/** Automatic connection watching */
	private watcher: ConnectionWatcher;
	/** A dictionary of the observer callbacks. Used to restore it after a soft reset */
	private rememberedObserveCallbacks = new Map<string, (resp: CoapResponse) => void>();

	// tslint:disable:unified-signatures
	constructor(hostname: string)
	constructor(hostname: string, customLogger: LoggerFunction)
	constructor(hostname: string, options: Partial<TradfriOptions>)
	// tslint:enable:unified-signatures
	constructor(
		public readonly hostname: string,
		optionsOrLogger?: LoggerFunction | Partial<TradfriOptions>,
	) {
		super();
		this.requestBase = `coaps://${hostname}:5684/`;

		if (typeof optionsOrLogger === "function") {
			// Legacy version: 2nd parameter is a logger
			setCustomLogger(optionsOrLogger);
		} else if (typeof optionsOrLogger === "object") {
			if (optionsOrLogger.customLogger != null) setCustomLogger(optionsOrLogger.customLogger);

			if (optionsOrLogger.useRawCoAPValues === true) this.ipsoOptions.skipValueSerializers = true;

			if (optionsOrLogger.watchConnection != null && optionsOrLogger.watchConnection !== false) {
				// true simply means "use default options" => don't pass a 2nd argument
				const watcherOptions = optionsOrLogger.watchConnection === true ? undefined : optionsOrLogger.watchConnection;
				this.watcher = new ConnectionWatcher(this, watcherOptions);

				// in the first iteration of this feature, just pass all events through
				const eventNames: ConnectionEvents[] = [
					"ping succeeded", "ping failed",
					"connection alive", "connection lost",
					"gateway offline",
					"reconnecting",
					"give up",
				];
				for (const event of eventNames) {
					this.watcher.on(event, (...args: any[]) => this.emit(event, ...args));
				}
			}
		}
	}

	/**
	 * Connect to the gateway
	 * @param identity A previously negotiated identity.
	 * @param psk The pre-shared key belonging to the identity.
	 */
	public async connect(identity: string, psk: string): Promise<true> {
		const maxAttempts = (this.watcher != null && this.watcher.options.reconnectionEnabled) ?
			this.watcher.options.maximumConnectionAttempts :
			1;
		const interval = this.watcher != null && this.watcher.options.connectionInterval;
		const backoffFactor = this.watcher != null && this.watcher.options.failedConnectionBackoffFactor;

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			if (attempt > 0) {
				const nextTimeout = Math.round(interval * backoffFactor ** Math.min(5, attempt - 1));
				log(`retrying connection in ${nextTimeout} ms`, "debug");
				await wait(nextTimeout);
			}

			switch (await this.tryToConnect(identity, psk)) {
				case true: {
					// start connection watching
					if (this.watcher != null) this.watcher.start();
					return true;
				}
				case "auth failed": throw new TradfriError(
					"The provided credentials are not valid. Please re-authenticate!",
					TradfriErrorCodes.AuthenticationFailed,
				);
				case "timeout": {
					// retry if allowed
					this.emit("connection failed", attempt + 1, maxAttempts);
					continue;
				}
				case "error": throw new TradfriError(
					"An unknown error occured while connecting to the gateway",
					TradfriErrorCodes.ConnectionFailed,
				);
			}
		}

		throw new TradfriError(
			`The gateway did not respond ${maxAttempts === 1 ? "in time" : `after ${maxAttempts} tries`}.`,
			TradfriErrorCodes.ConnectionTimedOut,
		);

	}

	/**
	 * Try to establish a connection to the configured gateway.
	 * @param identity The DTLS identity to use
	 * @param psk The pre-shared key to use
	 * @returns true if the connection attempt was successful, otherwise false.
	 */
	private async tryToConnect(identity: string, psk: string): Promise<ConnectionResult> {

		// initialize CoAP client
		coap.reset();
		coap.setSecurityParams(this.hostname, {
			psk: { [identity]: psk },
		});

		log(`Attempting connection. Identity = ${identity}, psk = ${psk}`, "debug");
		const result = await coap.tryToConnect(this.requestBase);
		if (result === true) {
			log("Connection successful", "debug");
		} else {
			log("Connection failed. Reason: " + result, "debug");
		}
		return result;
	}

	/**
	 * Negotiates a new identity and psk with the gateway to use for connections
	 * @param securityCode The security code that is printed on the gateway
	 * @returns The identity and psk to use for future connections. Store these!
	 * @throws TradfriError
	 */
	public async authenticate(securityCode: string): Promise<{ identity: string, psk: string }> {
		// first, check try to connect with the security code
		log("authenticate() > trying to connect with the security code", "debug");
		switch (await this.tryToConnect("Client_identity", securityCode)) {
			case true: break; // all good

			case "auth failed": throw new TradfriError(
				"The security code is wrong",
				TradfriErrorCodes.AuthenticationFailed,
			);
			case "timeout": throw new TradfriError(
				"The gateway did not respond in time.",
				TradfriErrorCodes.ConnectionTimedOut,
			);
			case "error": throw new TradfriError(
				"An unknown error occured while connecting to the gateway",
				TradfriErrorCodes.ConnectionFailed,
			);
		}

		// generate a new identity
		const identity = `tradfri_${Date.now()}`;
		log(`authenticating with identity "${identity}"`, "debug");

		// request creation of new PSK
		let payload: string | Buffer = JSON.stringify({ 9090: identity });
		payload = Buffer.from(payload);
		const response = await this.swallowInternalCoapRejections(coap.request(
			`${this.requestBase}${coapEndpoints.authentication}`,
			"post",
			payload,
		));

		// check the response
		if (response.code.toString() !== "2.01") {
			// that didn't work, so the code is wrong
			throw new TradfriError(
				`unexpected response (${response.code.toString()}) to getPSK().`,
				TradfriErrorCodes.AuthenticationFailed,
			);
		}
		// the response is a buffer containing a JSON object as a string
		const pskResponse = JSON.parse(response.payload.toString("utf8"));
		const psk = pskResponse["9091"];

		return { identity, psk };
	}

	/**
	 * Observes a resource at the given url and calls the callback when the information is updated.
	 * Prefer the specialized versions if possible.
	 * @param path The path of the resource
	 * @param callback The callback to be invoked when the resource updates
	 * @returns true if the observer was set up, false otherwise (e.g. if it already exists)
	 */
	public async observeResource(path: string, callback: (resp: CoapResponse) => void): Promise<boolean> {
		// check if we are already observing this resource
		const observerUrl = this.getObserverUrl(path);
		if (this.observedPaths.indexOf(observerUrl) > -1) return false;

		// start observing
		this.observedPaths.push(observerUrl);
		// and remember the callback to restore it after a soft-reset
		this.rememberedObserveCallbacks.set(observerUrl, callback);
		await this.swallowInternalCoapRejections(
			coap.observe(observerUrl, "get", callback),
		);
		return true;
	}

	private getObserverUrl(path: string): string {
		path = normalizeResourcePath(path);
		return path.startsWith(this.requestBase) ? path : `${this.requestBase}${path}`;
	}

	/**
	 * Checks if a resource is currently being observed
	 * @param path The path of the resource
	 */
	public isObserving(path: string): boolean {
		const observerUrl = this.getObserverUrl(path);
		return this.observedPaths.indexOf(observerUrl) > -1;
	}

	/**
	 * Stops observing a resource that is being observed through `observeResource`
	 * Use the specialized version of this method for observers that were set up with the specialized versions of `observeResource`
	 * @param path The path of the resource
	 */
	public stopObservingResource(path: string): void {
		// remove observer
		const observerUrl = this.getObserverUrl(path);
		const index = this.observedPaths.indexOf(observerUrl);
		if (index === -1) return;

		coap.stopObserving(observerUrl);
		this.observedPaths.splice(index, 1);
		this.rememberedObserveCallbacks.delete(observerUrl);
	}

	/**
	 * Resets the underlying CoAP client and clears all observers.
	 * @param preserveObservers Whether the active observers should be remembered to restore them later
	 */
	public reset(preserveObservers: boolean = false): void {
		coap.reset();
		this.clearObservers();
		if (!preserveObservers) this.rememberedObserveCallbacks.clear();
	}

	/**
	 * Closes the underlying CoAP client and clears all observers.
	 */
	public destroy(): void {
		if (this.watcher != null) this.watcher.stop();
		this.reset();
	}

	/**
	 * Clears the list of observers after a network reset
	 * This does not stop observing the resources if the observers are still active
	 */
	private clearObservers(): void {
		this.observedPaths = [];
	}

	/**
	 * Restores all previously remembered observers with their original callbacks
	 * Call this AFTER a dead connection was restored
	 */
	public async restoreObservers() {
		log("restoring previously used observers", "debug");

		let devicesRestored: boolean = false;
		const devicesPath = this.getObserverUrl(coapEndpoints.devices);
		let groupsAndScenesRestored: boolean = false;
		const groupsPath = this.getObserverUrl(coapEndpoints.groups);
		const scenesPath = this.getObserverUrl(coapEndpoints.scenes);

		for (const [path, callback] of this.rememberedObserveCallbacks.entries()) {
			if (path.indexOf(devicesPath) > -1) {
				if (!devicesRestored) {
					// restore all device observers (with a new callback)
					log("restoring device observers", "debug");
					await this.observeDevices();
					devicesRestored = true;
				}
			} else if (path.indexOf(groupsPath) > -1 || path.indexOf(scenesPath) > -1) {
				if (!groupsAndScenesRestored) {
					// restore all group and scene observers (with a new callback)
					log("restoring groups and scene observers", "debug");
					await this.observeGroupsAndScenes;
					groupsAndScenesRestored = true;
				}
			} else {
				// restore all custom observers with the old callback
				log(`restoring custom observer for path "${path}"`, "debug");
				await this.observeResource(path, callback);
			}
		}
	}

	private observeDevicesPromise: DeferredPromise<void>;
	/**
	 * Sets up an observer for all devices
	 * @returns A promise that resolves when the information about all devices has been received.
	 */
	public async observeDevices(): Promise<void> {
		if (this.isObserving(coapEndpoints.devices)) return;

		this.observeDevicesPromise = createDeferredPromise<void>();
		// although we return another promise, await the observeResource promise
		// so errors don't fall through the gaps
		await this.observeResource(
			coapEndpoints.devices,
			(resp) => this.observeDevices_callback(resp),
		);
		return this.observeDevicesPromise;
	}

	private async observeDevices_callback(response: CoapResponse) {

		// check response code
		if (response.code.toString() !== "2.05") {
			if (!this.handleNonSuccessfulResponse(
				response, `observeDevices()`, false,
			)) return;
		}

		const newDevices: number[] = parsePayload(response);

		log(`got all devices: ${JSON.stringify(newDevices)}`);

		// get old keys as int array
		const oldKeys = Object.keys(this.devices).map(k => +k).sort();
		// get new keys as int array
		const newKeys = newDevices.sort();
		// translate that into added and removed devices
		const addedKeys = except(newKeys, oldKeys);
		log(`adding devices with keys ${JSON.stringify(addedKeys)}`, "debug");

		const observeDevicePromises = newKeys.map(id => {
			const handleResponse = (resp: CoapResponse) => {
				// first, try to parse the device information
				const result = this.observeDevice_callback(id, resp);
				// if we are still waiting to confirm the `observeDevices` call,
				// check if we have received information about all devices
				if (this.observeDevicesPromise != null) {
					if (result) {
						if (newKeys.every(k => k in this.devices)) {
							this.observeDevicesPromise.resolve();
							this.observeDevicesPromise = null;
						}
					} else {
						this.observeDevicesPromise.reject(`The device with the id ${id} could not be observed`);
						this.observeDevicesPromise = null;
					}
				}
			};
			return this.observeResource(
				`${coapEndpoints.devices}/${id}`,
				handleResponse,
			);
		});
		await Promise.all(observeDevicePromises);

		const removedKeys = except(oldKeys, newKeys);
		log(`removing devices with keys ${JSON.stringify(removedKeys)}`, "debug");
		for (const id of removedKeys) {
			// remove device from dictionary
			delete this.devices[id];
			// remove observer
			this.stopObservingResource(`${coapEndpoints.devices}/${id}`);
			// and notify all listeners about the removal
			this.emit("device removed", id);
		}
	}

	public stopObservingDevices() {
		const pathPrefix = `${this.requestBase}${coapEndpoints.devices}`;
		// remove all observers pointing to a device related endpoint
		this.observedPaths
			.filter(p => p.startsWith(pathPrefix))
			.forEach(p => this.stopObservingResource(p))
			;
	}

	// gets called whenever "get /15001/<instanceId>" updates
	// returns true when the device was received successfully
	private observeDevice_callback(instanceId: number, response: CoapResponse): boolean {

		// check response code
		if (response.code.toString() !== "2.05") {
			if (!this.handleNonSuccessfulResponse(
				response, `observeDevice(${instanceId})`,
			)) return false;
		}

		const result = parsePayload(response);
		log(`observeDevice > ` + JSON.stringify(result), "debug");
		// parse device info
		const accessory = new Accessory(this.ipsoOptions)
			.parse(result)
			.fixBuggedProperties()
			.createProxy()
			;
		// remember the device object, so we can later use it as a reference for updates
		// store a clone, so we don't have to care what the calling library does
		this.devices[instanceId] = accessory.clone();
		// and notify all listeners about the update
		this.emit("device updated", accessory.link(this));
		return true;
	}

	private observeGroupsPromise: DeferredPromise<void>;
	private observeScenesPromises: Map<number, DeferredPromise<void>>;
	/**
	 * Sets up an observer for all groups and scenes
	 * @returns A promise that resolves when the information about all groups and scenes has been received.
	 */
	public async observeGroupsAndScenes(): Promise<void> {
		if (this.isObserving(coapEndpoints.groups)) return;

		this.observeGroupsPromise = createDeferredPromise<void>();
		// although we return another promise, await the observeResource promise
		// so errors don't fall through the gaps
		await this.observeResource(
			coapEndpoints.groups,
			(resp) => this.observeGroups_callback(resp),
		);
		return this.observeGroupsPromise;
	}

	// gets called whenever "get /15004" updates
	private async observeGroups_callback(response: CoapResponse) {

		// check response code
		if (response.code.toString() !== "2.05") {
			if (!this.handleNonSuccessfulResponse(
				response, `observeGroups()`, false,
			)) return;
		}

		const newGroups: number[] = parsePayload(response);

		log(`got all groups: ${JSON.stringify(newGroups)}`);

		// get old keys as int array
		const oldKeys = Object.keys(this.groups).map(k => +k).sort();
		// get new keys as int array
		const newKeys = newGroups.sort();
		// translate that into added and removed devices
		const addedKeys = except(newKeys, oldKeys);
		log(`adding groups with keys ${JSON.stringify(addedKeys)}`, "debug");

		// create a deferred promise for each group, so we can wait for them to be fulfilled
		if (this.observeScenesPromises == null) {
			this.observeScenesPromises = new Map(
				newKeys.map(id => [id, createDeferredPromise<void>()] as [number, DeferredPromise<void>]),
			);
		}
		const observeGroupPromises = newKeys.map(id => {
			const handleResponse = (resp: CoapResponse) => {
				// first, try to parse the device information
				const result = this.observeGroup_callback(id, resp);
				// if we are still waiting to confirm the `observeDevices` call,
				// check if we have received information about all devices
				if (this.observeGroupsPromise != null) {
					if (result) {
						if (newKeys.every(k => k in this.groups)) {
							// once we have all groups, wait for all scenes to be received
							Promise
								.all(this.observeScenesPromises.values())
								.then(() => {
									this.observeGroupsPromise.resolve();
									this.observeGroupsPromise = null;
									this.observeScenesPromises = null;
								})
								.catch(reason => {
									// in some cases, the promises can be null here
									if (this.observeGroupsPromise != null) {
										this.observeGroupsPromise.reject(reason);
									}
									this.observeGroupsPromise = null;
									this.observeScenesPromises = null;
								})
								;
						}
					} else {
						this.observeGroupsPromise.reject(`The group with the id ${id} could not be observed`);
						this.observeGroupsPromise = null;
					}
				}
			};
			return this.observeResource(
				`${coapEndpoints.groups}/${id}`,
				handleResponse,
			);
		});
		await Promise.all(observeGroupPromises);

		const removedKeys = except(oldKeys, newKeys);
		log(`removing groups with keys ${JSON.stringify(removedKeys)}`, "debug");
		removedKeys.forEach((id) => {
			// remove group from dictionary
			delete this.groups[id];
			// remove observers
			this.stopObservingGroup(id);
			// and notify all listeners about the removal
			this.emit("group removed", id);
		});
	}

	public stopObservingGroups() {
		for (const id of Object.keys(this.groups)) {
			this.stopObservingGroup(+id);
		}
	}

	private stopObservingGroup(instanceId: number) {
		this.stopObservingResource(`${coapEndpoints.groups}/${instanceId}`);
		const scenesPrefix = `${coapEndpoints.scenes}/${instanceId}`;
		for (const path of this.observedPaths) {
			if (path.startsWith(scenesPrefix)) {
				this.stopObservingResource(path);
			}
		}
	}

	// gets called whenever "get /15004/<instanceId>" updates
	private observeGroup_callback(instanceId: number, response: CoapResponse): boolean {

		// check response code
		if (response.code.toString() !== "2.05") {
			if (!this.handleNonSuccessfulResponse(
				response, `observeGroup(${instanceId})`,
			)) return false;
		}

		const result = parsePayload(response);
		// parse group info
		const group = new Group(this.ipsoOptions)
			.parse(result)
			.fixBuggedProperties()
			.createProxy()
			;
		// remember the group object, so we can later use it as a reference for updates
		let groupInfo: GroupInfo;
		if (!(instanceId in this.groups)) {
			// if there's none, create one
			this.groups[instanceId] = {
				group: null,
				scenes: {},
			};
		}
		groupInfo = this.groups[instanceId];
		// remember the group object, so we can later use it as a reference for updates
		// store a clone, so we don't have to care what the calling library does
		groupInfo.group = group.clone();

		// notify all listeners about the update
		this.emit("group updated", group.link(this));

		// load scene information
		this.observeResource(
			`${coapEndpoints.scenes}/${instanceId}`,
			(resp) => this.observeScenes_callback(instanceId, resp),
		);

		return true;
	}

	// gets called whenever "get /15005/<groupId>" updates
	private async observeScenes_callback(groupId: number, response: CoapResponse) {

		// check response code
		if (response.code.toString() !== "2.05") {
			if (!this.handleNonSuccessfulResponse(
				response, `observeScenes(${groupId})`, false,
			)) return;
		}

		const groupInfo = this.groups[groupId];
		const newScenes: number[] = parsePayload(response);

		log(`got all scenes in group ${groupId}: ${JSON.stringify(newScenes)}`);

		// get old keys as int array
		const oldKeys = Object.keys(groupInfo.scenes).map(k => +k).sort();
		// get new keys as int array
		const newKeys = newScenes.sort();
		// translate that into added and removed devices
		const addedKeys = except(newKeys, oldKeys);
		log(`adding scenes with keys ${JSON.stringify(addedKeys)} to group ${groupId}`, "debug");

		const observeScenePromises = newKeys.map(id => {
			const handleResponse = (resp: CoapResponse) => {
				// first, try to parse the device information
				const result = this.observeScene_callback(groupId, id, resp);
				// if we are still waiting to confirm the `observeDevices` call,
				// check if we have received information about all devices
				if (this.observeScenesPromises != null) {
					const scenePromise = this.observeScenesPromises.get(groupId);
					if (result) {
						if (newKeys.every(k => k in groupInfo.scenes)) {
							scenePromise.resolve();
						}
					} else {
						scenePromise.reject(`The scene with the id ${id} could not be observed`);
					}
				}
			};
			return this.observeResource(
				`${coapEndpoints.scenes}/${groupId}/${id}`,
				handleResponse,
			);
		});
		await Promise.all(observeScenePromises);

		const removedKeys = except(oldKeys, newKeys);
		log(`removing scenes with keys ${JSON.stringify(removedKeys)} from group ${groupId}`, "debug");
		removedKeys.forEach(id => {
			// remove scene from dictionary
			delete groupInfo.scenes[id];
			// remove observers
			this.stopObservingResource(`${coapEndpoints.scenes}/${groupId}/${id}`);
			// and notify all listeners about the removal
			this.emit("scene removed", groupId, id);
		});
	}

	// gets called whenever "get /15005/<groupId>/<instanceId>" updates
	private observeScene_callback(groupId: number, instanceId: number, response: CoapResponse): boolean {

		// check response code
		if (response.code.toString() !== "2.05") {
			if (!this.handleNonSuccessfulResponse(
				response, `observeScene(${groupId}, ${instanceId})`,
			)) return false;
		}

		const result = parsePayload(response);
		// parse scene info
		const scene = new Scene(this.ipsoOptions)
			.parse(result)
			.fixBuggedProperties()
			.createProxy()
			;
		// remember the scene object, so we can later use it as a reference for updates
		// store a clone, so we don't have to care what the calling library does
		this.groups[groupId].scenes[instanceId] = scene.clone();
		// and notify all listeners about the update
		this.emit("scene updated", groupId, scene.link(this));

		return true;
	}

	/**
	 * Handles a non-successful response, e.g. by error logging
	 * @param resp The response with a code that indicates an unsuccessful request
	 * @param context Some logging context to identify where the error comes from
	 * @returns true if the calling method may proceed, false if it should break
	 */
	private handleNonSuccessfulResponse(resp: CoapResponse, context: string, ignore404: boolean = true): boolean {
		// check response code
		const code = resp.code.toString();
		const payload = parsePayload(resp) || "";
		if (code === "4.04" && ignore404) {
			// not found
			// An observed resource has been deleted - all good
			// The observer will be removed soon
			return false;
		} else {
			this.emit("error", new Error(`unexpected response (${code}) to ${context}: ${payload}`));
			return false;
		}
	}

	/**
	 * Pings the gateway to check if it is alive
	 * @param timeout - (optional) Timeout in ms, after which the ping is deemed unanswered. Default: 5000ms
	 */
	public ping(timeout?: number): Promise<boolean> {
		return coap.ping(this.requestBase, timeout);
	}

	/**
	 * Updates a device object on the gateway
	 * @param accessory The device to be changed
	 * @returns true if a request was sent, false otherwise
	 */
	public updateDevice(accessory: Accessory): Promise<boolean> {
		// retrieve the original as a reference for serialization
		if (!(accessory.instanceId in this.devices)) {
			throw new Error(`The device with id ${accessory.instanceId} is not known and cannot be update!`);
		}
		const original = this.devices[accessory.instanceId];

		return this.updateResource(
			`${coapEndpoints.devices}/${accessory.instanceId}`,
			accessory, original,
		);
	}

	/**
	 * Updates a group object on the gateway
	 * @param group The group to be changed
	 * @returns true if a request was sent, false otherwise
	 */
	public updateGroup(group: Group): Promise<boolean> {
		// retrieve the original as a reference for serialization
		if (!(group.instanceId in this.groups)) {
			throw new Error(`The group with id ${group.instanceId} is not known and cannot be update!`);
		}
		const original = this.groups[group.instanceId].group;

		return this.updateResource(
			`${coapEndpoints.groups}/${group.instanceId}`,
			group, original,
		);
	}

	/**
	 * Updates a generic resource on the gateway
	 * @param path The path where the resource is located
	 * @param newObj The new object for the resource
	 * @param reference The reference value to calculate the diff
	 * @returns true if a request was sent, false otherwise
	 */
	private async updateResource(path: string, newObj: IPSOObject, reference: IPSOObject): Promise<boolean> {

		// ensure the ipso options were not lost on the user side
		newObj.options = this.ipsoOptions;

		log(`updateResource(${path}) > comparing ${JSON.stringify(newObj)} with the reference ${JSON.stringify(reference)}`, "debug");

		const serializedObj = newObj.serialize(reference);

		// If the serialized object contains no properties, we don't need to send anything
		if (!serializedObj || Object.keys(serializedObj).length === 0) {
			log(`updateResource(${path}) > empty object, not sending any payload`, "debug");
			return false;
		}

		// get the payload
		let payload: string | Buffer = JSON.stringify(serializedObj);
		log(`updateResource(${path}) > sending payload: ${payload}`, "debug");
		payload = Buffer.from(payload);

		await this.swallowInternalCoapRejections(coap.request(
			`${this.requestBase}${path}`, "put", payload,
		));
		return true;
	}

	/**
	 * Sets some properties on a group
	 * @param group The group to be updated
	 * @param operation The properties to be set
	 * @param force If the provided properties must be sent in any case
	 * @returns true if a request was sent, false otherwise
	 */
	public operateGroup(group: Group, operation: GroupOperation, force: boolean = false): Promise<boolean> {

		const newGroup = group.clone().merge(operation, true /* all props */);
		const reference = group.clone();
		if (force) {
			// to force the properties being sent, we need to reset them on the reference
			const inverseOperation = composeObject<number | boolean>(
				entries(operation)
					.map(([key, value]) => {
						switch (typeof value) {
							case "number": return [key, Number.NaN] as [string, number];
							case "boolean": return [key, !value] as [string, boolean];
							default: return [key, null] as [string, any];
						}
					}),
			);
			reference.merge(inverseOperation, true);
		}

		return this.updateResource(
			`${coapEndpoints.groups}/${group.instanceId}`,
			newGroup, reference,
		);
	}

	/**
	 * Sets some properties on a lightbulb
	 * @param accessory The parent accessory of the lightbulb
	 * @param operation The properties to be set
	 * @returns true if a request was sent, false otherwise
	 */
	public operateLight(accessory: Accessory, operation: LightOperation): Promise<boolean> {
		if (accessory.type !== AccessoryTypes.lightbulb) {
			throw new Error("The parameter accessory must be a lightbulb!");
		}

		const reference = accessory.clone();
		const newAccessory = reference.clone();
		newAccessory.lightList[0].merge(operation);

		return this.updateResource(
			`${coapEndpoints.devices}/${accessory.instanceId}`,
			newAccessory, reference,
		);
	}

	/**
	 * Sends a custom request to a resource
	 * @param path The path of the resource
	 * @param method The method of the request
	 * @param payload The optional payload as a JSON object
	 */
	public async request(
		path: string,
		method: RequestMethod,
		payload?: object,
	): Promise<{
		code: string,
		payload: any,
	}> {

		// create actual payload
		let jsonPayload: string | Buffer;
		if (payload != null) {
			jsonPayload = JSON.stringify(payload);
			log("sending custom payload: " + jsonPayload, "debug");
			jsonPayload = Buffer.from(jsonPayload);
		}

		// wait for the CoAP response and respond to the message
		const resp = await this.swallowInternalCoapRejections(coap.request(
			`${this.requestBase}${path}`,
			method,
			jsonPayload as Buffer,
		));
		return {
			code: resp.code.toString(),
			payload: parsePayload(resp),
		};
	}

	private swallowInternalCoapRejections<T>(promise: Promise<T>): Promise<T> {
		// We use the conventional promise pattern here so we can opt to never
		// resolve the promise in case we want to redirect it into an emitted error event
		return new Promise(async (resolve, reject) => {
			try {
				// try to resolve the promise normally
				resolve(await promise);
			} catch (e) {
				if (/coap\s?client was reset/i.test(e.message)) {
					// The CoAP client was reset. This happens when the user
					// resets the CoAP client while connections or requests
					// are still pending. It's not an error per se, so just
					// inform the user about what happened.
					this.emit("error", new TradfriError(
						"The network stack was reset. Pending promises will not be fulfilled.",
						TradfriErrorCodes.NetworkReset,
					));
				} else if (/dtls handshake timed out/i.test(e.message)) {
					// The DTLS layer did not complete a handshake in time.
					this.emit("error", new TradfriError(
						"Could not establish a secure connection in time. Pending promises will not be fulfilled.",
						TradfriErrorCodes.ConnectionTimedOut,
					));
				} else {
					reject(e);
				}
			}
		});
	}
}

/** Normalizes the path to a resource, so it can be used for storing the observer */
function normalizeResourcePath(path: string): string {
	path = path || "";
	while (path.startsWith("/")) path = path.slice(1);
	while (path.endsWith("/")) path = path.slice(0, -1);
	return path;
}

function parsePayload(response: CoapResponse): any {
	if (response.payload == null) return null;
	switch (response.format) {
		case 0: // text/plain
		case null: // assume text/plain
			return response.payload.toString("utf-8");
		case 50: // application/json
			const json = response.payload.toString("utf-8");
			return JSON.parse(json);
		default:
			// dunno how to parse this
			log(`unknown CoAP response format ${response.format}`, "warn");
			return response.payload;
	}
}
