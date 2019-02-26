"use strict";
// wotan-disable no-useless-predicate
// Until I'm sure that the properties may be nullable, we have to allow these "useless" checks
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("alcalzone-shared/math");
const accessory_1 = require("./accessory");
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
class Blind extends ipsoDevice_1.IPSODevice {
    constructor(options, accessory) {
        super(options);
        this.position = 0.0; // <float>
        // In order for the simplified API to work, the
        // accessory reference must be a proxy
        if (accessory != null && !accessory.isProxy) {
            accessory = accessory.createProxy();
        }
        this._accessory = accessory;
        // get the model number to detect features
        if (accessory != null &&
            accessory.deviceInfo != null &&
            accessory.deviceInfo.modelNumber != null &&
            accessory.deviceInfo.modelNumber.length > 0) {
            this._modelName = accessory.deviceInfo.modelNumber;
        }
    }
    /**
     * Returns true if the current blind is dimmable
     */
    get isDimmable() {
        return true; // we know no blinds that are dimmable
    }
    /**
     * Returns true if the current blind is switchable
     */
    get isSwitchable() {
        return false; // we know no blinds that aren't switchable
    }
    clone() {
        const ret = super.clone(this._accessory);
        ret._modelName = this._modelName;
        return ret;
    }
    /**
     * Creates a proxy which redirects the properties to the correct internal one, does nothing now
     */
    createProxy() {
        return this;
    }
    // =================================
    // Simplified API access
    /**
     * Ensures this instance is linked to a tradfri client and an accessory
     * @throws Throws an error if it isn't
     */
    ensureLink() {
        if (this.client == null) {
            throw new Error("Cannot use the simplified API on devices which aren't linked to a client instance.");
        }
        if (!(this._accessory instanceof accessory_1.Accessory)) {
            throw new Error("Cannot use the simplified API on plugs which aren't linked to an Accessory instance.");
        }
    }
    /** Open these blinds */
    open() {
        return this.operateBlind({ position: 100 }); // TODO: is this the right way around?
    }
    /** Close these blinds */
    close() {
        return this.operateBlind({ position: 0 }); // TODO: is this the right way around?
    }
    operateBlind(operation) {
        this.ensureLink();
        return this.client.operateBlind(this._accessory, operation);
    }
    /**
     * Changes this plug's "brightness". Any value > 0 turns the plug on, 0 turns it off.
     * @returns true if a request was sent, false otherwise
     */
    setPosition(value) {
        value = math_1.clamp(value, 0, 100);
        return this.operateBlind({ position: value });
    }
    /** Turns this object into JSON while leaving out the potential circular reference */
    toJSON() {
        return {
            position: this.position,
        };
    }
}
__decorate([
    ipsoObject_1.doNotSerialize,
    __metadata("design:type", Object)
], Blind.prototype, "_modelName", void 0);
__decorate([
    ipsoObject_1.doNotSerialize,
    __metadata("design:type", Object)
], Blind.prototype, "_accessory", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5536"),
    __metadata("design:type", Number)
], Blind.prototype, "position", void 0);
exports.Blind = Blind;
