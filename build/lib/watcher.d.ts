/// <reference types="node" />
import { EventEmitter } from "events";
import { TradfriClient } from "..";
/** Configures options for connection watching and automatic reconnection */
export interface ConnectionWatcherOptions {
    /** The interval in ms between consecutive pings */
    pingInterval: number;
    /** How many pings have to consecutively fail until the gateway is assumed offline */
    failedPingCountUntilOffline: number;
    /**
     * How much the interval between consecutive pings should be increased while the gateway is offline.
     * The actual interval is calculated by <ping interval> * <backoff factor> ** <min(5, # offline pings)>
     */
    failedPingBackoffFactor: number;
    /** Whether automatic reconnection is enabled */
    reconnectionEnabled: boolean;
    /** How many pings have to consecutively fail while the gateway is offline until a reconnection is triggered */
    offlinePingCountUntilReconnect: number;
    /** After how many failed reconnects we give up. Number.POSITIVE_INFINITY to never gonna give you up, never gonna let you down... */
    maximumReconnects: number;
}
export declare type ConnectionEvents = "ping succeeded" | "ping failed" | "connection alive" | "connection lost" | "gateway offline" | "reconnecting" | "give up";
export declare type PingFailedCallback = (failedPingCount: number) => void;
export declare type ReconnectingCallback = (reconnectAttempt: number, maximumReconnects: number) => void;
export interface ConnectionWatcher {
    on(event: "ping succeeded", callback: () => void): this;
    on(event: "ping failed", callback: PingFailedCallback): this;
    on(event: "connection alive", callback: () => void): this;
    on(event: "connection lost", callback: () => void): this;
    on(event: "gateway offline", callback: () => void): this;
    on(event: "reconnecting", callback: ReconnectingCallback): this;
    on(event: "give up", callback: () => void): this;
    on(event: ConnectionEvents, callback: (...args: any[]) => void): this;
    removeListener(event: "ping succeeded", callback: () => void): this;
    removeListener(event: "ping failed", callback: PingFailedCallback): this;
    removeListener(event: "connection alive", callback: () => void): this;
    removeListener(event: "connection lost", callback: () => void): this;
    removeListener(event: "gateway offline", callback: () => void): this;
    removeListener(event: "reconnecting", callback: ReconnectingCallback): this;
    removeListener(event: "give up", callback: () => void): this;
    removeAllListeners(event?: ConnectionEvents): this;
}
/**
 * Watches the connection of a TradfriClient and notifies about changes in the connection state
 */
export declare class ConnectionWatcher extends EventEmitter {
    private client;
    constructor(client: TradfriClient, options?: Partial<ConnectionWatcherOptions>);
    private options;
    private pingTimer;
    /** Starts watching the connection */
    start(): void;
    /** Stops watching the connection */
    stop(): void;
    private connectionAlive;
    private failedPingCount;
    private offlinePingCount;
    private resetAttempts;
    private pingThread();
}
