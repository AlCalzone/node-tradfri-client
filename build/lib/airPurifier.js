"use strict";
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
exports.AirPurifier = exports.FanMode = void 0;
const accessory_1 = require("./accessory");
const conversions_1 = require("./conversions");
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
var FanMode;
(function (FanMode) {
    FanMode[FanMode["Off"] = 0] = "Off";
    FanMode[FanMode["Auto"] = 1] = "Auto";
    FanMode[FanMode["Level1"] = 10] = "Level1";
    FanMode[FanMode["Level2"] = 20] = "Level2";
    FanMode[FanMode["Level3"] = 30] = "Level3";
    FanMode[FanMode["Level4"] = 40] = "Level4";
    FanMode[FanMode["Level5"] = 50] = "Level5";
})(FanMode = exports.FanMode || (exports.FanMode = {}));
class AirPurifier extends ipsoDevice_1.IPSODevice {
    constructor(options, accessory) {
        super(options);
        this.airQuality = 0; // <int> [0..100] / 0xffff
        this.controlsLocked = false;
        this.fanMode = FanMode.Off;
        this.fanSpeed = 0;
        this.totalFilterLifetime = 0;
        this.filterRuntime = 0;
        this.filterRemainingLifetime = 0;
        this.filterStatus = 0;
        this.statusLEDs = false;
        this.totalMotorRuntime = 0;
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
            throw new Error("Cannot use the simplified API on air purifiers which aren't linked to an Accessory instance.");
        }
    }
    /** Changes the fan mode of this air purifier */
    setFanMode(fanMode) {
        return this.operateAirPurifier({ fanMode });
    }
    /** Changes the fan speed of this air purifier */
    setFanSpeed(fanSpeed) {
        return this.operateAirPurifier({ fanSpeed });
    }
    /** Locks or unlocks the controls on the air purifier */
    setControlsLocked(locked) {
        return this.operateAirPurifier({ controlsLocked: locked });
    }
    /** Enables or disables the status LEDs */
    setStatusLEDs(enabled) {
        return this.operateAirPurifier({ statusLEDs: enabled });
    }
    operateAirPurifier(operation) {
        this.ensureLink();
        return this.client.operateAirPurifier(this._accessory, operation);
    }
    /** Turns this object into JSON while leaving out the potential circular reference */
    toJSON() {
        return {
            airQuality: this.airQuality,
            controlsLocked: this.controlsLocked,
            statusLEDs: this.statusLEDs,
            fanMode: this.fanMode,
            fanSpeed: this.fanSpeed,
            totalFilterLifetime: this.totalFilterLifetime,
            filterRuntime: this.filterRuntime,
            filterRemainingLifetime: this.filterRemainingLifetime,
            filterStatus: this.filterStatus,
            totalMotorRuntime: this.totalMotorRuntime,
        };
    }
}
__decorate([
    ipsoObject_1.doNotSerialize,
    __metadata("design:type", Object)
], AirPurifier.prototype, "_modelName", void 0);
__decorate([
    ipsoObject_1.doNotSerialize,
    __metadata("design:type", Object)
], AirPurifier.prototype, "_accessory", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("5907"),
    __metadata("design:type", Object)
], AirPurifier.prototype, "airQuality", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("5905"),
    __metadata("design:type", Boolean)
], AirPurifier.prototype, "controlsLocked", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("5900"),
    __metadata("design:type", Number)
], AirPurifier.prototype, "fanMode", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("5908"),
    (0, ipsoObject_1.serializeWith)(conversions_1.serializers.fanSpeed, { neverSkip: true }),
    __metadata("design:type", Number)
], AirPurifier.prototype, "fanSpeed", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("5904"),
    __metadata("design:type", Number)
], AirPurifier.prototype, "totalFilterLifetime", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("5902"),
    __metadata("design:type", Number)
], AirPurifier.prototype, "filterRuntime", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("5910"),
    __metadata("design:type", Number)
], AirPurifier.prototype, "filterRemainingLifetime", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("5903"),
    __metadata("design:type", Number)
], AirPurifier.prototype, "filterStatus", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("5906"),
    (0, ipsoObject_1.serializeWith)(conversions_1.serializers.booleanInverted, { neverSkip: true }),
    (0, ipsoObject_1.deserializeWith)(conversions_1.deserializers.booleanInverted, { neverSkip: true }),
    __metadata("design:type", Boolean)
], AirPurifier.prototype, "statusLEDs", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("5909"),
    __metadata("design:type", Number)
], AirPurifier.prototype, "totalMotorRuntime", void 0);
exports.AirPurifier = AirPurifier;
