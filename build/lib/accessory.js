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
        this.deviceInfo = null;
        this.alive = false;
        this.lastSeen = 0;
        this.otaUpdateState = 0; // boolean?
    }
    /**
     * Link this object to a TradfriClient for a simplified API.
     * INTERNAL USE ONLY!
     * @param client The client instance to link this object to
     */
    link(client) {
        super.link(client);
        if (this.lightList != null) {
            for (const light of this.lightList) {
                light.link(client);
            }
        }
        if (this.plugList != null) {
            for (const plug of this.plugList) {
                plug.link(client);
            }
        }
        if (this.sensorList != null) {
            for (const sensor of this.sensorList) {
                sensor.link(client);
            }
        }
        if (this.switchList != null) {
            for (const swtch of this.switchList) {
                swtch.link(client);
            }
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
    ipsoObject_1.deserializeWith(obj => new deviceInfo_1.DeviceInfo().parse(obj)),
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
    ipsoObject_1.deserializeWith((obj, me) => new light_1.Light(me).parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "lightList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3312"),
    ipsoObject_1.deserializeWith(obj => new plug_1.Plug().parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "plugList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3300"),
    ipsoObject_1.deserializeWith(obj => new sensor_1.Sensor().parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "sensorList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("15009"),
    ipsoObject_1.deserializeWith(obj => new ipsoDevice_1.IPSODevice().parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "switchList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9054"),
    __metadata("design:type", Number)
], Accessory.prototype, "otaUpdateState", void 0);
exports.Accessory = Accessory;
