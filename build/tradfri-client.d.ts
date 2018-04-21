/// <reference types="node" />
import { EventEmitter } from "events";
import { CoapResponse, RequestMethod } from "node-coap-client";
import { Accessory } from "./lib/accessory";
import { GatewayDetails } from "./lib/gatewayDetails";
import { Group, GroupInfo, GroupOperation } from "./lib/group";
import { LightOperation } from "./lib/light";
import { LoggerFunction } from "./lib/logger";
import { OperationProvider } from "./lib/operation-provider";
import { Scene } from "./lib/scene";
import { ConnectionEvents, ConnectionWatcherOptions, PingFailedCallback, ReconnectingCallback } from "./lib/watcher";
export declare type ObserveResourceCallback = (resp: CoapResponse) => void;
export declare type ObserveDevicesCallback = (addedDevices: Accessory[], removedDevices: Accessory[]) => void;
export declare type DeviceUpdatedCallback = (device: Accessory) => void;
export declare type DeviceRemovedCallback = (instanceId: number) => void;
export declare type GroupUpdatedCallback = (group: Group) => void;
export declare type GroupRemovedCallback = (instanceId: number) => void;
export declare type SceneUpdatedCallback = (groupId: number, scene: Scene) => void;
export declare type SceneRemovedCallback = (groupId: number, instanceId: number) => void;
export declare type ErrorCallback = (e: Error) => void;
export declare type ConnectionFailedCallback = (attempt: number, maxAttempts: number) => void;
export declare type GatewayUpdatedCallback = (gateway: GatewayDetails) => void;
export declare type ObservableEvents = "device updated" | "device removed" | "group updated" | "group removed" | "scene updated" | "scene removed" | "gateway updated" | "error" | "connection failed";
export interface TradfriClient {
    on(event: "device updated", callback: DeviceUpdatedCallback): this;
    on(event: "device removed", callback: DeviceRemovedCallback): this;
    on(event: "group updated", callback: GroupUpdatedCallback): this;
    on(event: "group removed", callback: GroupRemovedCallback): this;
    on(event: "scene updated", callback: SceneUpdatedCallback): this;
    on(event: "scene removed", callback: SceneRemovedCallback): this;
    on(event: "gateway updated", callback: GatewayUpdatedCallback): this;
    on(event: "error", callback: ErrorCallback): this;
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
    removeListener(event: "gateway updated", callback: GatewayUpdatedCallback): this;
    removeListener(event: "error", callback: ErrorCallback): this;
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
export interface TradfriOptions {
    /** Callback for a custom logger function. */
    customLogger: LoggerFunction;
    /** Whether to use raw CoAP values or the simplified scale */
    useRawCoAPValues: boolean;
    /** Whether the connection should be automatically watched */
    watchConnection: boolean | Partial<ConnectionWatcherOptions>;
}
export declare class TradfriClient extends EventEmitter implements OperationProvider {
    readonly hostname: string;
    /** dictionary of CoAP observers */
    observedPaths: string[];
    /** dictionary of known devices */
    devices: Record<string, Accessory>;
    /** dictionary of known groups */
    groups: Record<string, GroupInfo>;
    /** Base URL for all CoAP requests */
    private requestBase;
    /** Options regarding IPSO objects and serialization */
    private ipsoOptions;
    /** Automatic connection watching */
    private watcher;
    /** A dictionary of the observer callbacks. Used to restore it after a soft reset */
    private rememberedObserveCallbacks;
    constructor(hostname: string);
    constructor(hostname: string, customLogger: LoggerFunction);
    constructor(hostname: string, options: Partial<TradfriOptions>);
    /**
     * Connect to the gateway
     * @param identity A previously negotiated identity.
     * @param psk The pre-shared key belonging to the identity.
     */
    connect(identity: string, psk: string): Promise<true>;
    /**
     * Try to establish a connection to the configured gateway.
     * @param identity The DTLS identity to use
     * @param psk The pre-shared key to use
     * @returns true if the connection attempt was successful, otherwise false.
     */
    private tryToConnect(identity, psk);
    /**
     * Negotiates a new identity and psk with the gateway to use for connections
     * @param securityCode The security code that is printed on the gateway
     * @returns The identity and psk to use for future connections. Store these!
     * @throws TradfriError
     */
    authenticate(securityCode: string): Promise<{
        identity: string;
        psk: string;
    }>;
    /**
     * Observes a resource at the given url and calls the callback when the information is updated.
     * Prefer the specialized versions if possible.
     * @param path The path of the resource
     * @param callback The callback to be invoked when the resource updates
     * @returns true if the observer was set up, false otherwise (e.g. if it already exists)
     */
    observeResource(path: string, callback: (resp: CoapResponse) => void): Promise<boolean>;
    private getObserverUrl(path);
    /**
     * Checks if a resource is currently being observed
     * @param path The path of the resource
     */
    isObserving(path: string): boolean;
    /**
     * Stops observing a resource that is being observed through `observeResource`
     * Use the specialized version of this method for observers that were set up with the specialized versions of `observeResource`
     * @param path The path of the resource
     */
    stopObservingResource(path: string): void;
    /**
     * Resets the underlying CoAP client and clears all observers.
     * @param preserveObservers Whether the active observers should be remembered to restore them later
     */
    reset(preserveObservers?: boolean): void;
    /**
     * Closes the underlying CoAP client and clears all observers.
     */
    destroy(): void;
    /**
     * Clears the list of observers after a network reset
     * This does not stop observing the resources if the observers are still active
     */
    private clearObservers();
    /**
     * Restores all previously remembered observers with their original callbacks
     * Call this AFTER a dead connection was restored
     */
    restoreObservers(): Promise<void>;
    private observeDevicesPromise;
    /**
     * Sets up an observer for all devices
     * @returns A promise that resolves when the information about all devices has been received.
     */
    observeDevices(): Promise<void>;
    private observeDevices_callback(response);
    stopObservingDevices(): void;
    private observeDevice_callback(instanceId, response);
    private observeGroupsPromise;
    private observeScenesPromises;
    /**
     * Sets up an observer for all groups and scenes
     * @returns A promise that resolves when the information about all groups and scenes has been received.
     */
    observeGroupsAndScenes(): Promise<void>;
    private observeGroups_callback(response);
    stopObservingGroups(): void;
    private stopObservingGroup(instanceId);
    private observeGroup_callback(instanceId, response);
    private observeScenes_callback(groupId, response);
    private observeScene_callback(groupId, instanceId, response);
    private observeGatewayPromise;
    /**
     * Sets up an observer for the gateway
     * @returns A promise that resolves when the gateway information has been received for the first time
     */
    observeGateway(): Promise<void>;
    private observeGateway_callback(response);
    stopObservingGateway(): void;
    /**
     * Handles a non-successful response, e.g. by error logging
     * @param resp The response with a code that indicates an unsuccessful request
     * @param context Some logging context to identify where the error comes from
     * @returns true if the calling method may proceed, false if it should break
     */
    private handleNonSuccessfulResponse(resp, context, ignore404?);
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
     * @param force If the provided properties must be sent in any case
     * @returns true if a request was sent, false otherwise
     */
    operateGroup(group: Group, operation: GroupOperation, force?: boolean): Promise<boolean>;
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
    private swallowInternalCoapRejections<T>(promise);
}
