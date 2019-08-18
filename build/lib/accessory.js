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
const blind_1 = require("./blind");
const deviceInfo_1 = require("./deviceInfo");
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
const light_1 = require("./light");
const plug_1 = require("./plug");
const sensor_1 = require("./sensor");
// list of known endpoints defined on the gateway
var AccessoryTypes;
(function (AccessoryTypes) {
    /** A "normal" remote */
    AccessoryTypes[AccessoryTypes["remote"] = 0] = "remote";
    /**
     * A remote which has been paired with another remote.
     * See https://www.reddit.com/r/tradfri/comments/6x1miq for details
     */
    AccessoryTypes[AccessoryTypes["slaveRemote"] = 1] = "slaveRemote";
    /** A lightbulb */
    AccessoryTypes[AccessoryTypes["lightbulb"] = 2] = "lightbulb";
    /** A smart plug */
    AccessoryTypes[AccessoryTypes["plug"] = 3] = "plug";
    /** A motion sensor (currently unsupported) */
    AccessoryTypes[AccessoryTypes["motionSensor"] = 4] = "motionSensor";
    /** A smart blind */
    AccessoryTypes[AccessoryTypes["blind"] = 7] = "blind";
})(AccessoryTypes = exports.AccessoryTypes || (exports.AccessoryTypes = {}));
class Accessory extends ipsoDevice_1.IPSODevice {
    constructor() {
        // All properties only exist after the light has been received from the gateway
        // so they are definitely assigned!
        super(...arguments);
        this.type = AccessoryTypes.remote;
        this.alive = false;
        this.lastSeen = 0;
        this.otaUpdateState = 0; // boolean?
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
        /* istanbul ignore next */
        if (this.blindList != null) {
            for (const blind of this.blindList) {
                blind.link(client);
            }
        }
        return this;
    }
    /**
     * Fixes property values that are known to be bugged
     */
    fixBuggedProperties() {
        super.fixBuggedProperties();
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
        /* istanbul ignore next */
        if (this.blindList != null) {
            this.blindList = this.blindList.map(blind => blind.fixBuggedProperties());
        }
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
    ipsoObject_1.deserializeWith((obj, me) => new plug_1.Plug(me.options, me).parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "plugList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3300"),
    ipsoObject_1.deserializeWith(/* istanbul ignore next */ (obj, me) => new sensor_1.Sensor(me.options).parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "sensorList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("15009"),
    ipsoObject_1.deserializeWith(/* istanbul ignore next */ (obj, me) => new ipsoDevice_1.IPSODevice(me.options).parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "switchList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("15015"),
    ipsoObject_1.deserializeWith((obj, me) => new blind_1.Blind(me.options, me).parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "blindList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9054"),
    __metadata("design:type", Number)
], Accessory.prototype, "otaUpdateState", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9084"),
    __metadata("design:type", String)
], Accessory.prototype, "UNKNOWN1", void 0);
exports.Accessory = Accessory;
