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
const defaultOptions = {
    watchEnabled: false,
    pingInterval: 10000,
    failedPingCountUntilOffline: 1,
    failedPingBackoffFactor: 1.5,
    reconnectionEnabled: true,
    offlinePingCountUntilReconnect: 3,
    maximumReconnects: Number.POSITIVE_INFINITY,
};
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
        throw new Error("The maximum number of reconnect attempts must be positive");
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
        checkOptions(options);
        this.options = Object.assign(defaultOptions, options);
        // start immediately if configured
        if (this.options.watchEnabled)
            this.start();
    }
    /** Starts watching the connection */
    start() {
        if (this.pingTimer != null)
            throw new Error("The connection watcher is already running");
        this.pingTimer = setTimeout(() => this.pingThread(), this.options.pingInterval);
    }
    /** Stops watching the connection */
    stop() {
        if (this.pingTimer != null) {
            clearTimeout(this.pingTimer);
            this.pingTimer = null;
        }
    }
    pingThread() {
        return __awaiter(this, void 0, void 0, function* () {
            const oldValue = this.connectionAlive;
            this.connectionAlive = yield this.client.ping();
            // see if the connection state has changed
            if (this.connectionAlive) {
                this.emit("ping succeeded");
                this.failedPingCount = 0;
                this.offlinePingCount = 0;
                this.resetAttempts = 0;
                // connection is now alive again
                if (!oldValue)
                    this.emit("connection alive");
            }
            else {
                this.emit("ping failed");
                if (oldValue)
                    this.emit("connection lost");
                // connection is dead
                this.failedPingCount++;
                if (this.failedPingCount >= this.options.failedPingCountUntilOffline) {
                    if (this.failedPingCount === this.options.failedPingCountUntilOffline) {
                        // we just reached the threshold, say the gateway is offline
                        this.emit("gateway offline");
                    }
                    // if we should reconnect automatically, count the offline pings
                    if (this.options.reconnectionEnabled) {
                        // as soon as we pass the threshold, reset the client
                        if (this.offlinePingCount >= this.options.offlinePingCountUntilReconnect) {
                            if (this.resetAttempts <= this.options.maximumReconnects) {
                                // trigger a reconnect
                                this.emit("reconnecting");
                                this.client.reset();
                                this.offlinePingCount = 0;
                                this.resetAttempts++;
                            }
                            else {
                                // don't try anymore
                                this.emit("give up");
                            }
                        }
                    }
                }
            }
            // schedule the next ping
            const nextTimeout = this.options.pingInterval * Math.pow(this.options.failedPingBackoffFactor, Math.min(5, this.failedPingCount));
            this.pingTimer = setTimeout(() => this.pingThread, nextTimeout);
        });
    }
}
exports.ConnectionWatcher = ConnectionWatcher;
