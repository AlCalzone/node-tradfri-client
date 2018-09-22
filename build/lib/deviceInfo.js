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
const ipsoObject_1 = require("./ipsoObject");
var PowerSources;
(function (PowerSources) {
    PowerSources[PowerSources["Unknown"] = 0] = "Unknown";
    PowerSources[PowerSources["InternalBattery"] = 1] = "InternalBattery";
    PowerSources[PowerSources["ExternalBattery"] = 2] = "ExternalBattery";
    PowerSources[PowerSources["Battery"] = 3] = "Battery";
    PowerSources[PowerSources["PowerOverEthernet"] = 4] = "PowerOverEthernet";
    PowerSources[PowerSources["USB"] = 5] = "USB";
    PowerSources[PowerSources["AC_Power"] = 6] = "AC_Power";
    PowerSources[PowerSources["Solar"] = 7] = "Solar";
})(PowerSources = exports.PowerSources || (exports.PowerSources = {}));
// contains information about a specific device
class DeviceInfo extends ipsoObject_1.IPSOObject {
    constructor() {
        // All properties only exist after the light has been received from the gateway
        // so they are definitely assigned!
        super(...arguments);
        this.firmwareVersion = "";
        this.manufacturer = "";
        this.modelNumber = "";
        this.power = PowerSources.Unknown;
        this.serialNumber = "";
    }
}
__decorate([
    ipsoObject_1.ipsoKey("9"),
    __metadata("design:type", Number)
], DeviceInfo.prototype, "battery", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3"),
    __metadata("design:type", String)
], DeviceInfo.prototype, "firmwareVersion", void 0);
__decorate([
    ipsoObject_1.ipsoKey("0"),
    __metadata("design:type", String)
], DeviceInfo.prototype, "manufacturer", void 0);
__decorate([
    ipsoObject_1.ipsoKey("1"),
    __metadata("design:type", String)
], DeviceInfo.prototype, "modelNumber", void 0);
__decorate([
    ipsoObject_1.ipsoKey("6"),
    __metadata("design:type", Number)
], DeviceInfo.prototype, "power", void 0);
__decorate([
    ipsoObject_1.ipsoKey("2"),
    __metadata("design:type", String)
], DeviceInfo.prototype, "serialNumber", void 0);
exports.DeviceInfo = DeviceInfo;
