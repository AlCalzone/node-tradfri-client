import { CoapResponse, RequestMethod } from "node-coap-client";
import { Accessory } from "./lib/accessory";
import { Group, GroupInfo, GroupOperation } from "./lib/group";
import { LightOperation } from "./lib/light";
import { LoggerFunction } from "./lib/logger";
import { DictionaryLike } from "./lib/object-polyfill";
import { TradfriObserverAPI } from "./lib/tradfri-observer";
export declare type ObserveResourceCallback = (resp: CoapResponse) => void;
export declare type ObserveDevicesCallback = (addedDevices: Accessory[], removedDevices: Accessory[]) => void;
export declare class TradfriClient {
    readonly hostname: string;
    /** dictionary of CoAP observers */
    observedPaths: string[];
    private observer;
    /** dictionary of known devices */
    devices: DictionaryLike<Accessory>;
    /** dictionary of known groups */
    groups: DictionaryLike<GroupInfo>;
    /** Base URL for all CoAP requests */
    private requestBase;
    constructor(hostname: string, customLogger: LoggerFunction);
    /**
     * Connect to the gateway
     * @param securityCode The security code that is printed on the gateway
     * @param identity (optional) A previously negotiated identity. If none is given, a new one is returned on success.
     * @param psk (optional) The pre-shared key belonging to the identity. If none is given, a new one is returned on success.
     */
    connect(securityCode: string, identity?: string, psk?: string): Promise<{
        usedIdentity?: string;
        usedPSK?: string;
    }>;
    /**
     * Try to establish a connection to the configured gateway.
     * @param identity The DTLS identity to use
     * @param psk The pre-shared key to use
     * @returns true if the connection attempt was successful, otherwise false.
     */
    private tryToConnect(identity, psk);
    private authenticate();
    /**
     * Observes a resource at the given url and calls the callback when the information is updated.
     * Prefer the specialized versions if possible.
     * @param path The path of the resource
     * @param callback The callback to be invoked when the resource updates
     */
    observeResource(path: string, callback: (resp: CoapResponse) => void): Promise<void>;
    /**
     * Stops observing a resource that is being observed through `observeResource`
     * Use the specialized version of this method for observers that were set up with the specialized versions of `observeResource`
     * @param path The path of the resource
     */
    stopObservingResource(path: string): void;
    /**
     * Resets the underlying CoAP client and clears all observers.
     */
    reset(): void;
    /**
     * Closes the underlying CoAP client and clears all observers.
     */
    destroy(): void;
    /**
     * Clears the list of observers after a network reset
     * This does not stop observing the resources if the observers are still active
     */
    private clearObservers();
    getObserver(): TradfriObserverAPI;
    /** Sets up an observer for all devices */
    observeDevices(): Promise<TradfriObserverAPI>;
    private observeDevices_callback(response);
    stopObservingDevices(): void;
    private observeDevice_callback(instanceId, response);
    /** Sets up an observer for all groups */
    observeGroupsAndScenes(): Promise<TradfriObserverAPI>;
    private observeGroups_callback(response);
    stopObservingGroups(): void;
    private stopObservingGroup(instanceId);
    private observeGroup_callback(instanceId, response);
    private observeScenes_callback(groupId, response);
    private observeScene_callback(groupId, instanceId, response);
    /**
     * Pings the gateway to check if it is alive
     * @param timeout - (optional) Timeout in ms, after which the ping is deemed unanswered. Default: 5000ms
     */
    ping(timeout?: number): Promise<boolean>;
    /**
     * Updates a device object on the gateway
     * @param accessory The device to be changed
     * @returns true if a request was sent, false otherwise
     */
    updateDevice(accessory: Accessory): Promise<boolean>;
    /**
     * Updates a group object on the gateway
     * @param group The group to be changed
     * @returns true if a request was sent, false otherwise
     */
    updateGroup(group: Group): Promise<boolean>;
    /**
     * Updates a generic resource on the gateway
     * @param path The path where the resource is located
     * @param newObj The new object for the resource
     * @param reference The reference value to calculate the diff
     * @returns true if a request was sent, false otherwise
     */
    private updateResource(path, newObj, reference);
    /**
     * Sets some properties on a group
     * @param group The group to be updated
     * @param operation The properties to be set
     * @returns true if a request was sent, false otherwise
     */
    operateGroup(group: Group, operation: GroupOperation): Promise<boolean>;
    /**
     * Sets some properties on a lightbulb
     * @param accessory The parent accessory of the lightbulb
     * @param operation The properties to be set
     * @returns true if a request was sent, false otherwise
     */
    operateLight(accessory: Accessory, operation: LightOperation): Promise<boolean>;
    /**
     * Sends a custom request to a resource
     * @param path The path of the resource
     * @param method The method of the request
     * @param payload The optional payload as a JSON object
     */
    request(path: string, method: RequestMethod, payload?: object): Promise<{
        code: string;
        payload: any;
    }>;
}
