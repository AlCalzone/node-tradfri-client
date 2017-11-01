// load external modules
import { CoapClient as coap, CoapResponse } from "node-coap-client";

// load internal modules
import { Accessory } from "./lib/accessory";
import { except } from "./lib/array-extensions";
import { endpoints as coapEndpoints } from "./lib/endpoints";
import { Group, GroupInfo } from "./lib/group";
import { log, LoggerFunction, setCustomLogger } from "./lib/logger";
import { DictionaryLike } from "./lib/object-polyfill";
import { wait } from "./lib/promises";
import { Scene } from "./lib/scene";
import { TradfriError, TradfriErrorCodes } from "./lib/tradfri-error";
import { TradfriObserver, TradfriObserverAPI } from "./lib/tradfri-observer";

export type ObserveResourceCallback = (resp: CoapResponse) => void;
export type ObserveDevicesCallback = (addedDevices: Accessory[], removedDevices: Accessory[]) => void;

export class TradfriClient {

	/** dictionary of CoAP observers */
	public observedPaths: string[] = [];
	private observer: TradfriObserver;
	/** dictionary of known devices */
	public devices: DictionaryLike<Accessory> = {};
	/** dictionary of known groups */
	public groups: DictionaryLike<GroupInfo> = {};

	/** Base URL for all CoAP requests */
	private requestBase: string;

	constructor(
		public readonly hostname: string,
		public readonly securityCode: string,
		customLogger: LoggerFunction,
	) {
		// prepare connection
		this.requestBase = `coaps://${hostname}:5684/`;
		coap.setSecurityParams(hostname, {
			psk: { Client_identity: securityCode },
		});

		if (customLogger != null) setCustomLogger(customLogger);
	}

	/**
	 * Try to establish a connection to the configured gateway.
	 * Throws if the connection could not be established.
	 * @param maxAttempts Number of connection attempts before giving up
	 * @param attemptInterval Milliseconds to wait between connection attempts
	 */
	public async connect(maxAttempts: number = 3, attemptInterval: number = 1000): Promise<void> {
		if (maxAttempts < 1) throw new Error("At least one connection attempt must be made");
		if (attemptInterval < 0) throw new Error("The interval between two connection attempts must be positive");

		// Try a few times to setup a working connection
		for (let i = 1; i <= maxAttempts; i++) {
			if (await coap.tryToConnect(this.requestBase)) {
				break; // it worked
			} else if (i < maxAttempts) {
				log(`Could not connect to gateway, try #${i}`, "warn");
				if (attemptInterval > 0) await wait(attemptInterval);
			} else if (i === maxAttempts) {
				// no working connection
				throw new TradfriError(
					`Could not connect to the gateway ${this.requestBase} after ${maxAttempts} tries!`,
					TradfriErrorCodes.ConnectionFailed,
				);
			}
		}
		// Done!
	}

	/**
	 * Observes a resource at the given url and calls the callback when the information is updated.
	 * Prefer the specialized versions if possible.
	 * @param path The path of the resource
	 * @param callback The callback to be invoked when the resource updates
	 */
	public async observeResource(path: string, callback: (resp: CoapResponse) => void): Promise<void> {

		path = normalizeResourcePath(path);

		// check if we are already observing this resource
		const observerUrl = `${this.requestBase}${path}`;
		if (this.observedPaths.indexOf(observerUrl) > -1) return;

		// start observing
		this.observedPaths.push(observerUrl);
		return coap.observe(observerUrl, "get", callback);
	}

	/**
	 * Stops observing a resource that is being observed through `observeResource`
	 * Use the specialized version of this method for observers that were set up with the specialized versions of `observeResource`
	 * @param path The path of the resource
	 */
	public stopObservingResource(path: string): void {

		path = normalizeResourcePath(path);

		// remove observer
		const observerUrl = `${this.requestBase}${path}`;
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

	public getObserver(): TradfriObserverAPI {
		if (this.observer == null) this.observer = new TradfriObserver();
		return this.observer.getAPI();
	}

	/** Sets up an observer for all devices */
	public async observeDevices(): Promise<TradfriObserverAPI> {
		const ret = this.getObserver();
		await this.observeResource(
			coapEndpoints.devices,
			this.observeDevices_callback,
		);
		return ret;
	}

	private async observeDevices_callback(response: CoapResponse) {
		if (response.code.toString() !== "2.05") {
			log(`unexpected response (${response.code.toString()}) to observeDevices.`, "error");
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
			return this.observeResource(
				`${coapEndpoints.devices}/${id}`,
				(resp) => this.observeDevice_callback(id, resp),
			);
		});
		await Promise.all(observeDevicePromises);

		const removedKeys = except(oldKeys, newKeys);
		log(`removing devices with keys ${JSON.stringify(removedKeys)}`, "debug");
		for (const id of removedKeys) {
			if (id in this.devices) delete this.devices[id];
			// remove observer
			this.stopObservingResource(`${coapEndpoints.devices}/${id}`);
			// and notify all listeners about the removal
			this.observer.raise("device removed", id);
		}
	}

	public stopObservingDevices() {
		for (const path of this.observedPaths) {
			if (path.startsWith(coapEndpoints.devices)) {
				this.stopObservingResource(path);
			}
		}
	}

	// gets called whenever "get /15001/<instanceId>" updates
	private observeDevice_callback(instanceId: number, response: CoapResponse) {
		if (response.code.toString() !== "2.05") {
			log(`unexpected response (${response.code.toString()}) to observeDevice(${instanceId}).`, "error");
			return;
		}
		const result = parsePayload(response);
		// parse device info
		const accessory = new Accessory().parse(result).createProxy();
		// remember the device object, so we can later use it as a reference for updates
		this.devices[instanceId] = accessory;
		// and notify all listeners about the update
		this.observer.raise("device updated", accessory);
	}

	/** Sets up an observer for all groups */
	public async observeGroupsAndScenes(): Promise<TradfriObserverAPI> {
		const ret = this.getObserver();
		await this.observeResource(
			coapEndpoints.groups,
			this.observeGroups_callback,
		);
		return ret;
	}

	// gets called whenever "get /15004" updates
	private async observeGroups_callback(response: CoapResponse) {

		if (response.code.toString() !== "2.05") {
			log(`unexpected response (${response.code.toString()}) to getAllGroups.`, "error");
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
			if (id in this.groups) delete this.groups[id];
			// remove observers
			this.stopObservingGroup(id);
			// and notify all listeners about the removal
			this.observer.raise("group removed", id);
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
				log(`unexpected response (${response.code.toString()}) to getGroup(${instanceId}).`, "error");
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
		groupInfo.group = group;

		// notify all listeners about the update
		this.observer.raise("group updated", group);

		// load scene information
		this.observeResource(
			`${coapEndpoints.scenes}/${instanceId}`,
			(resp) => this.observeScenes_callback(instanceId, resp),
		);
	}

	// gets called whenever "get /15005/<groupId>" updates
	private async observeScenes_callback(groupId: number, response: CoapResponse) {
		if (response.code.toString() !== "2.05") {
			log(`unexpected response (${response.code.toString()}) to observeScenes(${groupId}).`, "error");
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
			if (id in groupInfo.scenes) delete groupInfo.scenes[id];
			// remove observers
			this.stopObservingResource(`${coapEndpoints.scenes}/${groupId}/${id}`);
			// and notify all listeners about the removal
			this.observer.raise("scene removed", groupId, id);
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
				log(`unexpected response (${response.code.toString()}) to observeScene(${groupId}, ${instanceId}).`, "error");
				return;
		}

		const result = parsePayload(response);
		// parse scene info
		const scene = (new Scene()).parse(result).createProxy();
		// remember the scene object, so we can later use it as a reference for updates
		this.groups[groupId].scenes[instanceId] = scene;
		// and notify all listeners about the update
		this.observer.raise("scene updated", groupId, scene);
	}

	/**
	 * Pings the gateway to check if it is alive
	 * @param timeout - (optional) Timeout in ms, after which the ping is deemed unanswered. Default: 5000ms
	 */
	public ping(timeout?: number): Promise<boolean> {
		return coap.ping(this.requestBase, timeout);
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
