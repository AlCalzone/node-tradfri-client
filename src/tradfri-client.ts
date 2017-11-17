// load external modules
import { EventEmitter } from "events";
import { CoapClient as coap, CoapResponse, RequestMethod } from "node-coap-client";

// load internal modules
import { Accessory, AccessoryTypes } from "./lib/accessory";
import { except } from "./lib/array-extensions";
import { createDeferredPromise, DeferredPromise } from "./lib/defer-promise";
import { endpoints as coapEndpoints } from "./lib/endpoints";
import { Group, GroupInfo, GroupOperation } from "./lib/group";
import { IPSOObject } from "./lib/ipsoObject";
import { LightOperation } from "./lib/light";
import { log, LoggerFunction, setCustomLogger } from "./lib/logger";
import { DictionaryLike } from "./lib/object-polyfill";
import { OperationProvider } from "./lib/operation-provider";
import { Scene } from "./lib/scene";
import { TradfriError, TradfriErrorCodes } from "./lib/tradfri-error";

export type ObserveResourceCallback = (resp: CoapResponse) => void;
export type ObserveDevicesCallback = (addedDevices: Accessory[], removedDevices: Accessory[]) => void;

export type DeviceUpdatedCallback = (device: Accessory) => void;
export type DeviceRemovedCallback = (instanceId: number) => void;
export type GroupUpdatedCallback = (group: Group) => void;
export type GroupRemovedCallback = (instanceId: number) => void;
export type SceneUpdatedCallback = (groupId: number, scene: Scene) => void;
export type SceneRemovedCallback = (groupId: number, instanceId: number) => void;
export type ErrorCallback = (e: Error) => void;

export type ObservableEvents =
	"device updated" |
	"device removed" |
	"group updated" |
	"group removed" |
	"scene updated" |
	"scene removed" |
	"error"
	;

export declare interface TradfriClient {
	on(event: "device updated", callback: DeviceUpdatedCallback): this;
	on(event: "device removed", callback: DeviceRemovedCallback): this;
	on(event: "group updated", callback: GroupUpdatedCallback): this;
	on(event: "group removed", callback: GroupRemovedCallback): this;
	on(event: "scene updated", callback: SceneUpdatedCallback): this;
	on(event: "scene removed", callback: SceneRemovedCallback): this;
	on(event: "error", callback: ErrorCallback): this;

	removeListener(event: "device updated", callback: DeviceUpdatedCallback): this;
	removeListener(event: "device removed", callback: DeviceRemovedCallback): this;
	removeListener(event: "group updated", callback: GroupUpdatedCallback): this;
	removeListener(event: "group removed", callback: GroupRemovedCallback): this;
	removeListener(event: "scene updated", callback: SceneUpdatedCallback): this;
	removeListener(event: "scene removed", callback: SceneRemovedCallback): this;
	removeListener(event: "error", callback: ErrorCallback): this;

	removeAllListeners(event?: ObservableEvents): this;
}

export class TradfriClient extends EventEmitter implements OperationProvider {

	/** dictionary of CoAP observers */
	public observedPaths: string[] = [];
	/** dictionary of known devices */
	public devices: DictionaryLike<Accessory> = {};
	/** dictionary of known groups */
	public groups: DictionaryLike<GroupInfo> = {};

	/** Base URL for all CoAP requests */
	private requestBase: string;

	constructor(
		public readonly hostname: string,
		customLogger?: LoggerFunction,
	) {
		super();
		this.requestBase = `coaps://${hostname}:5684/`;
		if (customLogger != null) setCustomLogger(customLogger);
	}

	/**
	 * Connect to the gateway
	 * @param identity A previously negotiated identity.
	 * @param psk The pre-shared key belonging to the identity.
	 */
	public async connect(identity: string, psk: string): Promise<boolean> {
		return this.tryToConnect(identity, psk);
	}

	/**
	 * Try to establish a connection to the configured gateway.
	 * @param identity The DTLS identity to use
	 * @param psk The pre-shared key to use
	 * @returns true if the connection attempt was successful, otherwise false.
	 */
	private async tryToConnect(identity: string, psk: string): Promise<boolean> {

		// initialize CoAP client
		coap.reset();
		coap.setSecurityParams(this.hostname, {
			psk: { [identity]: psk },
		});

		log(`Attempting connection. Identity = ${identity}, psk = ${psk}`, "debug");
		const result = await coap.tryToConnect(this.requestBase);
		log(`Connection ${result ? "" : "un"}successful`, "debug");
		return result;
	}

	/**
	 * Negotiates a new identity and psk with the gateway to use for connections
	 * @param securityCode The security code that is printed on the gateway
	 * @returns The identity and psk to use for future connections. Store these!
	 * @throws TradfriError
	 */
	public async authenticate(securityCode: string): Promise<{identity: string, psk: string}> {
		// first, check try to connect with the security code
		log("authenticate() > trying to connect with the security code", "debug");
		if (!await this.tryToConnect("Client_identity", securityCode)) {
			// that didn't work, so the code is wrong
			throw new TradfriError("The security code is wrong", TradfriErrorCodes.ConnectionFailed);
		}
		// generate a new identity
		const identity = `tradfri_${Date.now()}`;
		log(`authenticating with identity "${identity}"`, "debug");

		// request creation of new PSK
		let payload: string | Buffer = JSON.stringify({ 9090: identity });
		payload = Buffer.from(payload);
		const response = await coap.request(
			`${this.requestBase}${coapEndpoints.authentication}`,
			"post",
			payload,
		);

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

		return {identity, psk};
	}

	/**
	 * Observes a resource at the given url and calls the callback when the information is updated.
	 * Prefer the specialized versions if possible.
	 * @param path The path of the resource
	 * @param callback The callback to be invoked when the resource updates
	 * @returns true if the observer was set up, false otherwise (e.g. if it already exists)
	 */
	public async observeResource(path: string, callback: (resp: CoapResponse) => void): Promise<boolean> {

		path = normalizeResourcePath(path);

		// check if we are already observing this resource
		const observerUrl = `${this.requestBase}${path}`;
		if (this.observedPaths.indexOf(observerUrl) > -1) return false;

		// start observing
		this.observedPaths.push(observerUrl);
		await coap.observe(observerUrl, "get", callback);
		return true;
	}

	/**
	 * Stops observing a resource that is being observed through `observeResource`
	 * Use the specialized version of this method for observers that were set up with the specialized versions of `observeResource`
	 * @param path The path of the resource
	 */
	public stopObservingResource(path: string): void {

		path = normalizeResourcePath(path);

		// remove observer
		const observerUrl = path.startsWith(this.requestBase) ? path : `${this.requestBase}${path}`;
		const index = this.observedPaths.indexOf(observerUrl);
		if (index === -1) return;

		coap.stopObserving(observerUrl);
		this.observedPaths.splice(index, 1);
	}

	/**
	 * Resets the underlying CoAP client and clears all observers.
	 */
	public reset(): void {
		coap.reset();
		this.clearObservers();
	}

	/**
	 * Closes the underlying CoAP client and clears all observers.
	 */
	public destroy(): void {
		// TODO: do we need to do more?
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
	 * Sets up an observer for all devices
	 * @returns A promise that resolves when the information about all devices has been received.
	 */
	public async observeDevices(): Promise<void> {
		const ret = createDeferredPromise<void>();
		// although we return another promise, await the observeResource promise
		// so errors don't fall through the gaps
		await this.observeResource(
			coapEndpoints.devices,
			(resp) => this.observeDevices_callback(ret, resp),
		);
		return ret;
	}

	private async observeDevices_callback(observePromise: DeferredPromise<void>, response: CoapResponse) {
		if (response.code.toString() !== "2.05") {
			this.emit("error", new Error(`unexpected response (${response.code.toString()}) to observeDevices.`));
			return;
		}
		const newDevices = parsePayload(response);

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
				if (observePromise != null) {
					if (result) {
						if (newKeys.length === Object.keys(this.devices).length) {
							observePromise.resolve();
							observePromise = null;
						}
					} else {
						observePromise.reject(`The device with the id ${id} could not be observed`);
						observePromise = null;
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
		if (response.code.toString() !== "2.05") {
			this.emit("error", new Error(`unexpected response (${response.code.toString()}) to observeDevice(${instanceId}).`));
			return false;
		}
		const result = parsePayload(response);
		log(`observeDevice > ` + JSON.stringify(result), "debug");
		// parse device info
		const accessory = new Accessory().parse(result).createProxy();
		// remember the device object, so we can later use it as a reference for updates
		// store a clone, so we don't have to care what the calling library does
		this.devices[instanceId] = accessory.clone();
		// and notify all listeners about the update
		this.emit("device updated", accessory.link(this));
		return true;
	}

	/** Sets up an observer for all groups */
	public async observeGroupsAndScenes(): Promise<this> {
		await this.observeResource(
			coapEndpoints.groups,
			this.observeGroups_callback.bind(this),
		);
		return this;
	}

	// gets called whenever "get /15004" updates
	private async observeGroups_callback(response: CoapResponse) {

		if (response.code.toString() !== "2.05") {
			this.emit("error", new Error(`unexpected response (${response.code.toString()}) to getAllGroups.`));
			return;
		}
		const newGroups = parsePayload(response);

		log(`got all groups: ${JSON.stringify(newGroups)}`);

		// get old keys as int array
		const oldKeys = Object.keys(this.groups).map(k => +k).sort();
		// get new keys as int array
		const newKeys = newGroups.sort();
		// translate that into added and removed devices
		const addedKeys = except(newKeys, oldKeys);
		log(`adding groups with keys ${JSON.stringify(addedKeys)}`, "debug");

		const observeGroupPromises = newKeys.map(id => {
			return this.observeResource(
				`${coapEndpoints.groups}/${id}`,
				(resp) => this.observeGroup_callback(id, resp),
			);
		});
		await Promise.all(observeGroupPromises);

		const removedKeys = except(oldKeys, newKeys);
		log(`removing groups with keys ${JSON.stringify(removedKeys)}`, "debug");
		removedKeys.forEach(async (id) => {
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
	private async observeGroup_callback(instanceId: number, response: CoapResponse) {

		// check response code
		switch (response.code.toString()) {
			case "2.05": break; // all good
			case "4.04": // not found
				// We know this group existed or we wouldn't have requested it
				// This means it has been deleted
				// TODO: Should we delete it here or where its being handled right now?
				return;
			default:
				this.emit("error", new Error(`unexpected response (${response.code.toString()}) to getGroup(${instanceId}).`));
				return;
		}

		const result = parsePayload(response);
		// parse group info
		const group = (new Group()).parse(result).createProxy();
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
	}

	// gets called whenever "get /15005/<groupId>" updates
	private async observeScenes_callback(groupId: number, response: CoapResponse) {
		if (response.code.toString() !== "2.05") {
			this.emit("error", new Error(`unexpected response (${response.code.toString()}) to observeScenes(${groupId}).`));
			return;
		}

		const groupInfo = this.groups[groupId];
		const newScenes = parsePayload(response);

		log(`got all scenes in group ${groupId}: ${JSON.stringify(newScenes)}`);

		// get old keys as int array
		const oldKeys = Object.keys(groupInfo.scenes).map(k => +k).sort();
		// get new keys as int array
		const newKeys = newScenes.sort();
		// translate that into added and removed devices
		const addedKeys = except(newKeys, oldKeys);
		log(`adding scenes with keys ${JSON.stringify(addedKeys)} to group ${groupId}`, "debug");

		const observeScenePromises = newKeys.map(id => {
			return this.observeResource(
				`${coapEndpoints.scenes}/${groupId}/${id}`,
				(resp) => this.observeScene_callback(groupId, id, resp),
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
	private observeScene_callback(groupId: number, instanceId: number, response: CoapResponse) {

		// check response code
		switch (response.code.toString()) {
			case "2.05": break; // all good
			case "4.04": // not found
				// We know this scene existed or we wouldn't have requested it
				// This means it has been deleted
				// TODO: Should we delete it here or where its being handled right now?
				return;
			default:
				this.emit("error", new Error(`unexpected response (${response.code.toString()}) to observeScene(${groupId}, ${instanceId}).`));
				return;
		}

		const result = parsePayload(response);
		// parse scene info
		const scene = (new Scene()).parse(result).createProxy();
		// remember the scene object, so we can later use it as a reference for updates
		// store a clone, so we don't have to care what the calling library does
		this.groups[groupId].scenes[instanceId] = scene.clone();
		// and notify all listeners about the update
		this.emit("scene updated", groupId, scene.link(this));
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
	public async updateDevice(accessory: Accessory): Promise<boolean> {
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
	public async updateGroup(group: Group): Promise<boolean> {
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

		await coap.request(
			`${this.requestBase}${path}`, "put", payload,
		);
		return true;
	}

	/**
	 * Sets some properties on a group
	 * @param group The group to be updated
	 * @param operation The properties to be set
	 * @returns true if a request was sent, false otherwise
	 */
	public async operateGroup(group: Group, operation: GroupOperation): Promise<boolean> {

		const reference = group.clone();
		const newGroup = reference.clone().merge(operation);

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
	public async operateLight(accessory: Accessory, operation: LightOperation): Promise<boolean> {
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
		const resp = await coap.request(
			`${this.requestBase}${path}`,
			method,
			jsonPayload as Buffer,
		);
		return {
			code: resp.code.toString(),
			payload: parsePayload(resp),
		};
	}
}

/** Normalizes the path to a resource, so it can be used for storing the observer */
function normalizeResourcePath(path: string): string {
	path = path || "";
	while (path.startsWith("/")) path = path.substring(1);
	while (path.endsWith("/")) path = path.substring(0, -1);
	return path;
}

function parsePayload(response: CoapResponse): any {
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
