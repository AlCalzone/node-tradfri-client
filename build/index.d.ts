/// <reference types="node" />
import { EventEmitter } from "events";
import { CoapResponse } from "node-coap-client";
import { Accessory } from "./lib/accessory";
import { GroupInfo } from "./lib/group";
import { LoggerFunction } from "./lib/logger";
import { DictionaryLike } from "./lib/object-polyfill";
import { TradfriObserverAPI } from "./lib/tradfri-observer";
export declare type ObserveResourceCallback = (resp: CoapResponse) => void;
export declare type ObserveDevicesCallback = (addedDevices: Accessory[], removedDevices: Accessory[]) => void;
export declare class TradfriClient extends EventEmitter {
    readonly hostname: string;
    readonly securityCode: string;
    /** dictionary of CoAP observers */
    observedPaths: string[];
    private observer;
    /** dictionary of known devices */
    devices: DictionaryLike<Accessory>;
    /** dictionary of known groups */
    groups: DictionaryLike<GroupInfo>;
    /** Base URL for all CoAP requests */
    private requestBase;
    constructor(hostname: string, securityCode: string, customLogger: LoggerFunction);
    /**
     * Try to establish a connection to the configured gateway.
     * Throws if the connection could not be established.
     * @param maxAttempts Number of connection attempts before giving up
     * @param attemptInterval Milliseconds to wait between connection attempts
     */
    connect(maxAttempts?: number, attemptInterval?: number): Promise<void>;
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
     * Resets the underlying CoAP client and clears all observers
     */
    reset(): void;
    /**
     * Clears the list of observers after a network reset
     * This does not stop observing the resources if the observers are still active
     */
    private clearObservers();
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
}
