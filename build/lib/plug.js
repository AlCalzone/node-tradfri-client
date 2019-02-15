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
const conversions_1 = require("./conversions");
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
class Plug extends ipsoDevice_1.IPSODevice {
    constructor(options, accessory) {
        super(options);
        this.cumulativeActivePower = 0.0; // <float>
        this.dimmer = 0; // <int> [0..100]
        this.onOff = false;
        this.onTime = 0; // <int>
        this.powerFactor = 0.0; // <float>
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
    // TODO: no unit???
    // @ipsoKey("5701")
    // public unit: string = "";
    /**
     * Returns true if the current plug is dimmable
     */
    get isDimmable() {
        return false; // we know no plugs that are dimmable
    }
    /**
     * Returns true if the current plug is switchable
     */
    get isSwitchable() {
        return true; // we know no plugs that aren't switchable
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
    /** Turn this plug on */
    turnOn() {
        return this.operatePlug({ onOff: true });
    }
    /** Turn this plug off */
    turnOff() {
        return this.operatePlug({ onOff: false });
    }
    /** Toggles this plug on or off */
    toggle(value = !this.onOff) {
        return this.operatePlug({ onOff: value });
    }
    operatePlug(operation) {
        this.ensureLink();
        return this.client.operatePlug(this._accessory, operation);
    }
    /**
     * Changes this plug's "brightness". Any value > 0 turns the plug on, 0 turns it off.
     * @returns true if a request was sent, false otherwise
     */
    setBrightness(value) {
        value = math_1.clamp(value, 0, 100);
        return this.operatePlug({ dimmer: value });
    }
    /** Turns this object into JSON while leaving out the potential circular reference */
    toJSON() {
        return {
            onOff: this.onOff,
        };
    }
}
__decorate([
    ipsoObject_1.doNotSerialize,
    __metadata("design:type", Object)
], Plug.prototype, "_modelName", void 0);
__decorate([
    ipsoObject_1.doNotSerialize,
    __metadata("design:type", Object)
], Plug.prototype, "_accessory", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5805"),
    __metadata("design:type", Number)
], Plug.prototype, "cumulativeActivePower", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5851"),
    ipsoObject_1.serializeWith(conversions_1.serializers.brightness),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.brightness),
    __metadata("design:type", Number)
], Plug.prototype, "dimmer", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5850"),
    __metadata("design:type", Boolean)
], Plug.prototype, "onOff", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5852"),
    __metadata("design:type", Number)
], Plug.prototype, "onTime", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5820"),
    __metadata("design:type", Number)
], Plug.prototype, "powerFactor", void 0);
exports.Plug = Plug;
