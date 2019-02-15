"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const logger_1 = require("./logger");
const defaultOptions = Object.freeze({
    pingInterval: 10000,
    failedPingCountUntilOffline: 1,
    failedPingBackoffFactor: 1.5,
    reconnectionEnabled: true,
    offlinePingCountUntilReconnect: 3,
    maximumReconnects: Number.POSITIVE_INFINITY,
    connectionInterval: 10000,
    failedConnectionBackoffFactor: 1.5,
    maximumConnectionAttempts: Number.POSITIVE_INFINITY,
});
function checkOptions(opts) {
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
        throw new Error("The maximum number of reconnect attempts must be at least 1");
    }
    if (opts.connectionInterval != null && (opts.connectionInterval < 1000 || opts.connectionInterval > 5 * 60000)) {
        throw new Error("The connection interval must be between 1s and 5 minutes");
    }
    if (opts.failedConnectionBackoffFactor != null && (opts.failedConnectionBackoffFactor < 1 || opts.failedConnectionBackoffFactor > 3)) {
        throw new Error("The interval back-off factor for failed connections must be between 1 and 3");
    }
    if (opts.maximumConnectionAttempts != null && opts.maximumConnectionAttempts < 1) {
        throw new Error("The maximum number of connection attempts must be at least 1");
    }
}
/**
 * Watches the connection of a TradfriClient and notifies about changes in the connection state
 */
class ConnectionWatcher extends events_1.EventEmitter {
    constructor(client, options) {
        super();
        this.client = client;
        this.failedPingCount = 0;
        this.offlinePingCount = 0;
        this.resetAttempts = 0;
        if (options == null)
            options = {};
        checkOptions(options);
        this._options = Object.assign({}, defaultOptions, options);
    }
    get options() {
        return this._options;
    }
    /** Starts watching the connection */
    start() {
        if (this.pingTimer != null)
            throw new Error("The connection watcher is already running");
        this.isActive = true;
        this.pingTimer = setTimeout(() => void this.pingThread(), this._options.pingInterval);
    }
    /** Stops watching the connection */
    stop() {
        if (this.pingTimer != null) {
            clearTimeout(this.pingTimer);
            this.pingTimer = undefined;
        }
        this.isActive = false;
    }
    pingThread() {
        return __awaiter(this, void 0, void 0, function* () {
            const oldValue = this.connectionAlive;
            this.connectionAlive = yield this.client.ping();
            // see if the connection state has changed
            if (this.connectionAlive) {
                logger_1.log("ping succeeded", "debug");
                this.emit("ping succeeded");
                // connection is now alive again
                if (oldValue === false) {
                    logger_1.log(`The connection is alive again after ${this.failedPingCount} failed pings`, "debug");
                    this.emit("connection alive");
                    // also restore the observers if necessary
                    if (this.resetAttempts > 0) {
                        // don't await or we might get stuck when the promise gets dropped
                        void this.client.restoreObservers().catch(() => { });
                    }
                }
                // reset all counters because the connection is good again
                this.failedPingCount = 0;
                this.offlinePingCount = 0;
                this.resetAttempts = 0;
            }
            else {
                this.failedPingCount++;
                logger_1.log(`ping failed (#${this.failedPingCount})`, "debug");
                this.emit("ping failed", this.failedPingCount);
                if (oldValue === true) {
                    logger_1.log("The connection was lost", "debug");
                    this.emit("connection lost");
                }
                // connection is dead
                if (this.failedPingCount >= this._options.failedPingCountUntilOffline) {
                    if (this.failedPingCount === this._options.failedPingCountUntilOffline) {
                        // we just reached the threshold, say the gateway is offline
                        logger_1.log(`${this.failedPingCount} consecutive pings failed. The gateway is offline.`, "debug");
                        this.emit("gateway offline");
                    }
                    // if we should reconnect automatically, count the offline pings
                    if (this._options.reconnectionEnabled) {
                        this.offlinePingCount++;
                        // as soon as we pass the threshold, reset the client
                        if (this.offlinePingCount >= this._options.offlinePingCountUntilReconnect) {
                            if (this.resetAttempts < this._options.maximumReconnects) {
                                // trigger a reconnect
                                this.offlinePingCount = 0;
                                this.resetAttempts++;
                                logger_1.log(`Trying to reconnect... Attempt ${this.resetAttempts} of ${this._options.maximumReconnects === Number.POSITIVE_INFINITY ? "∞" : this._options.maximumReconnects}`, "debug");
                                this.emit("reconnecting", this.resetAttempts, this._options.maximumReconnects);
                                this.client.reset(true);
                            }
                            else if (this.resetAttempts === this._options.maximumReconnects) {
                                // don't try anymore
                                logger_1.log("Maximum reconnect attempts reached... giving up.", "debug");
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
                const nextTimeout = Math.round(this._options.pingInterval * Math.pow(this._options.failedPingBackoffFactor, Math.min(5, this.failedPingCount)));
                logger_1.log("setting next timeout in " + nextTimeout, "debug");
                this.pingTimer = setTimeout(() => void this.pingThread(), nextTimeout);
            }
        });
    }
}
exports.ConnectionWatcher = ConnectionWatcher;
