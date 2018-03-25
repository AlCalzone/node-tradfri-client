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
const deviceInfo_1 = require("./deviceInfo");
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
const light_1 = require("./light");
const logger_1 = require("./logger");
const plug_1 = require("./plug");
const sensor_1 = require("./sensor");
// list of known endpoints defined on the gateway
var AccessoryTypes;
(function (AccessoryTypes) {
    AccessoryTypes[AccessoryTypes["remote"] = 0] = "remote";
    AccessoryTypes[AccessoryTypes["lightbulb"] = 2] = "lightbulb";
    AccessoryTypes[AccessoryTypes["motionSensor"] = 4] = "motionSensor";
    // TODO: find out the other ones
})(AccessoryTypes = exports.AccessoryTypes || (exports.AccessoryTypes = {}));
class Accessory extends ipsoDevice_1.IPSODevice {
    constructor() {
        super(...arguments);
        this.type = AccessoryTypes.remote;
        this.alive = false;
        this.lastSeen = 0;
        this.otaUpdateState = 0; // boolean?
        /**
         * Remember if this is a light but incorrectly announced as a remote
         * Fixes this firmware bug: GH#67
         * @internal
         */
        this.isLightAnnouncedAsRemote = false;
    }
    clone() {
        const ret = super.clone();
        ret.isLightAnnouncedAsRemote = this.isLightAnnouncedAsRemote;
        return ret;
    }
    /**
     * Link this object to a TradfriClient for a simplified API.
     * @param client The client instance to link this object to
     * @internal
     */
    link(client) {
        super.link(client);
        if (this.lightList != null) {
            for (const light of this.lightList) {
                light.link(client);
            }
        }
        /* istanbul ignore next */
        if (this.plugList != null) {
            for (const plug of this.plugList) {
                plug.link(client);
            }
        }
        /* istanbul ignore next */
        if (this.sensorList != null) {
            for (const sensor of this.sensorList) {
                sensor.link(client);
            }
        }
        /* istanbul ignore next */
        if (this.switchList != null) {
            for (const swtch of this.switchList) {
                swtch.link(client);
            }
        }
        return this;
    }
    /**
     * Fixes property values that are known to be bugged
     */
    fixBuggedProperties() {
        logger_1.log(`Accessory: fixing bugged properties`, "silly");
        super.fixBuggedProperties();
        // Fix GH#67
        if (this.type !== AccessoryTypes.lightbulb &&
            this.deviceInfo != null &&
            light_1.Light.shouldBeALight(this.deviceInfo.modelNumber) &&
            (this.lightList == null || this.lightList.length === 0) &&
            (this.switchList != null && this.switchList.length !== null)) {
            this.isLightAnnouncedAsRemote = true;
            this.type = AccessoryTypes.lightbulb;
            this.lightList = this.switchList.map(swtch => new light_1.Light(this.options, this).parse(swtch.originalPayload));
            this.switchList = null;
        }
        if (this.lightList != null) {
            this.lightList = this.lightList.map(light => light.fixBuggedProperties());
        }
        /* istanbul ignore next */
        if (this.plugList != null) {
            this.plugList = this.plugList.map(plug => plug.fixBuggedProperties());
        }
        /* istanbul ignore next */
        if (this.sensorList != null) {
            this.sensorList = this.sensorList.map(sensor => sensor.fixBuggedProperties());
        }
        /* istanbul ignore next */
        if (this.switchList != null) {
            this.switchList = this.switchList.map(swtch => swtch.fixBuggedProperties());
        }
        return this;
    }
    restoreBuggedProperties() {
        logger_1.log(`Accessory: restoring bugged properties`, "silly");
        if (this.lightList != null) {
            this.lightList = this.lightList.map(light => light.restoreBuggedProperties());
        }
        /* istanbul ignore next */
        if (this.plugList != null) {
            this.plugList = this.plugList.map(plug => plug.restoreBuggedProperties());
        }
        /* istanbul ignore next */
        if (this.sensorList != null) {
            this.sensorList = this.sensorList.map(sensor => sensor.restoreBuggedProperties());
        }
        /* istanbul ignore next */
        if (this.switchList != null) {
            this.switchList = this.switchList.map(swtch => swtch.restoreBuggedProperties());
        }
        // Fix GH#67
        if (this.isLightAnnouncedAsRemote) {
            this.type = AccessoryTypes.remote;
            this.switchList = this.lightList; // we want to serialize lights!
            this.lightList = undefined;
        }
        super.restoreBuggedProperties();
        return this;
    }
}
__decorate([
    ipsoObject_1.ipsoKey("5750"),
    __metadata("design:type", Number)
], Accessory.prototype, "type", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3"),
    ipsoObject_1.deserializeWith((obj, me) => new deviceInfo_1.DeviceInfo(me.options).parse(obj)),
    __metadata("design:type", deviceInfo_1.DeviceInfo)
], Accessory.prototype, "deviceInfo", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9019"),
    __metadata("design:type", Boolean)
], Accessory.prototype, "alive", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9020"),
    __metadata("design:type", Number)
], Accessory.prototype, "lastSeen", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3311"),
    ipsoObject_1.deserializeWith((obj, me) => new light_1.Light(me.options, me).parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "lightList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3312"),
    ipsoObject_1.deserializeWith((obj, me) => new plug_1.Plug(me.options).parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "plugList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3300"),
    ipsoObject_1.deserializeWith((obj, me) => new sensor_1.Sensor(me.options).parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "sensorList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("15009"),
    ipsoObject_1.deserializeWith((obj, me) => new ipsoDevice_1.IPSODevice(me.options).parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "switchList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9054"),
    __metadata("design:type", Number)
], Accessory.prototype, "otaUpdateState", void 0);
__decorate([
    ipsoObject_1.doNotSerialize,
    __metadata("design:type", Boolean)
], Accessory.prototype, "isLightAnnouncedAsRemote", void 0);
exports.Accessory = Accessory;
