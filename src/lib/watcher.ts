import { EventEmitter } from "events";
import { TradfriClient } from "..";
import { log } from "./logger";

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

const defaultOptions: ConnectionWatcherOptions = {
	pingInterval: 10000, // 10s
	failedPingCountUntilOffline: 1,
	failedPingBackoffFactor: 1.5,

	reconnectionEnabled: true, // when the watch is enabled, also reconnect
	offlinePingCountUntilReconnect: 3,
	maximumReconnects: Number.POSITIVE_INFINITY, // don't stop believing
};

function checkOptions(opts: Partial<ConnectionWatcherOptions>) {
	if (opts.pingInterval != null && (opts.pingInterval < 1000 || opts.pingInterval > 5 * 60000)) {
		throw new Error("The ping interval must be between 1s and 5 minutes");
	}
	if (opts.failedPingCountUntilOffline != null && (opts.failedPingCountUntilOffline < 1 || opts.failedPingCountUntilOffline > 10)) {
		throw new Error("The failed ping count to assume the gateway as offline must be between 1 and 10");
	}
	if (opts.failedPingBackoffFactor != null && (opts.failedPingBackoffFactor < 1 || opts.failedPingBackoffFactor > 3)) {
		throw new Error("The interval back-off factor for failed pings must be between 1 and 3");
	}
	if (opts.offlinePingCountUntilReconnect != null && (opts.offlinePingCountUntilReconnect < 1 || opts.offlinePingCountUntilReconnect > 10)) {
		throw new Error("The failed ping count before a reconnect attempt must be between 1 and 10");
	}
	if (opts.maximumReconnects != null && opts.maximumReconnects < 1) {
		throw new Error("The maximum number of reconnect attempts must be positive");
	}
}

export type ConnectionEvents =
	"ping succeeded" | "ping failed" |
	"connection alive" | "connection lost" |
	"gateway offline" |
	"reconnecting" |
	"give up"
	;

export type PingFailedCallback = (failedPingCount: number) => void;
export type ReconnectingCallback = (reconnectAttempt: number, maximumReconnects: number) => void;

// tslint:disable:unified-signatures
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
// tslint:enable:unified-signatures

/**
 * Watches the connection of a TradfriClient and notifies about changes in the connection state
 */
export class ConnectionWatcher extends EventEmitter {

	constructor(
		private client: TradfriClient,
		options?: Partial<ConnectionWatcherOptions>,
	) {
		super();
		if (options == null) options = {};
		checkOptions(options);
		this.options = Object.assign(defaultOptions, options);
	}

	private options: ConnectionWatcherOptions;
	private pingTimer: NodeJS.Timer;

	/** Starts watching the connection */
	public start() {
		if (this.pingTimer != null) throw new Error("The connection watcher is already running");
		this.isActive = true;
		this.pingTimer = setTimeout(() => this.pingThread(), this.options.pingInterval);
	}

	private isActive: boolean;
	/** Stops watching the connection */
	public stop() {
		if (this.pingTimer != null) {
			clearTimeout(this.pingTimer);
			this.pingTimer = null;
		}
		this.isActive = false;
	}

	private connectionAlive: boolean;
	private failedPingCount: number = 0;
	private offlinePingCount: number = 0;
	private resetAttempts: number = 0;

	private async pingThread() {
		const oldValue = this.connectionAlive;
		this.connectionAlive = await this.client.ping();

		// see if the connection state has changed
		if (this.connectionAlive) {
			log("ping succeeded", "debug");
			this.emit("ping succeeded");
			// connection is now alive again
			if (oldValue === false) {
				log(`The connection is alive again after ${this.failedPingCount} failed pings`, "debug");
				this.emit("connection alive");
			}
			// reset all counters because the connection is good again
			this.failedPingCount = 0;
			this.offlinePingCount = 0;
			this.resetAttempts = 0;
		} else {
			this.failedPingCount++;
			log(`ping failed (#${this.failedPingCount})`, "debug");
			this.emit("ping failed", this.failedPingCount);
			if (oldValue === true) {
				log("The connection was lost", "debug");
				this.emit("connection lost");
			}

			// connection is dead
			if (this.failedPingCount >= this.options.failedPingCountUntilOffline) {
				if (this.failedPingCount === this.options.failedPingCountUntilOffline) {
					// we just reached the threshold, say the gateway is offline
					log(`${this.failedPingCount} consecutive pings failed. The gateway is offline.`, "debug");
					this.emit("gateway offline");
				}

				// if we should reconnect automatically, count the offline pings
				if (this.options.reconnectionEnabled) {
					this.offlinePingCount++;
					// as soon as we pass the threshold, reset the client
					if (this.offlinePingCount >= this.options.offlinePingCountUntilReconnect) {
						if (this.resetAttempts < this.options.maximumReconnects) {
							// trigger a reconnect
							this.offlinePingCount = 0;
							this.resetAttempts++;
							log(`Trying to reconnect... Attempt ${this.resetAttempts} of ${this.options.maximumReconnects === Number.POSITIVE_INFINITY ? "∞" : this.options.maximumReconnects}`, "debug");
							this.emit("reconnecting", this.resetAttempts, this.options.maximumReconnects);
							this.client.reset();
						} else if (this.resetAttempts === this.options.maximumReconnects) {
							// don't try anymore
							log("Maximum reconnect attempts reached... giving up.", "debug");
							this.emit("give up");
							// increase the counter once more so this branch doesn't get hit
							this.resetAttempts++;
						}
					}
				}
			}
		}

		// schedule the next ping
		if (this.isActive) {
			const nextTimeout = Math.round(this.options.pingInterval * this.options.failedPingBackoffFactor ** Math.min(5, this.failedPingCount));
			log("setting next timeout in " + nextTimeout, "debug");
			this.pingTimer = setTimeout(() => this.pingThread(), nextTimeout);
		}
	}
}
