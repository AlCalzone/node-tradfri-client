"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TradfriObserver {
    constructor() {
        this.callbacks = {
            "device updated": [],
            "device removed": [],
            "group updated": [],
            "group removed": [],
            "scene updated": [],
            "scene removed": [],
        };
    }
    raise(event, ...args) {
        for (const cb of this.callbacks[event]) {
            // tslint:disable-next-line:ban-types
            cb.call(this._api, ...args);
        }
        return this;
    }
    // tslint:enable:unified-signatures
    on(event, callback) {
        this.callbacks[event].push(callback);
    }
    off(event, callback) {
        if (callback != null) {
            // remove a special callback
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1)
                this.callbacks[event].splice(index, 1);
        }
        else {
            // remove all callbacks
            this.callbacks[event] = [];
        }
    }
    getAPI() {
        if (this._api == null) {
            this._api = {
                on: (event, callback) => {
                    this.on(event, callback);
                    return this._api;
                },
                off: (event, callback) => {
                    this.off(event, callback);
                    return this._api;
                },
            };
        }
        return this._api;
    }
}
exports.TradfriObserver = TradfriObserver;
