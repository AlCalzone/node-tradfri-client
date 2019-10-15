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
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
/* istanbul ignore next */
class Sensor extends ipsoDevice_1.IPSODevice {
    constructor() {
        super(...arguments);
        this.appType = ""; // TODO: find out where this is defined
        this.sensorType = ""; // TODO: find out where this is defined
        this.minMeasuredValue = 0.0; // float
        this.maxMeasuredValue = 0.0; // float
        this.minRangeValue = 0.0; // float
        this.maxRangeValue = 0.0; // float
        this.resetMinMaxMeasureValue = false;
        this.sensorValue = 0.0; // float
        this.unit = "";
    }
}
__decorate([
    ipsoObject_1.ipsoKey("5750"),
    __metadata("design:type", String)
], Sensor.prototype, "appType", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5751"),
    __metadata("design:type", String)
], Sensor.prototype, "sensorType", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5601"),
    __metadata("design:type", Number)
], Sensor.prototype, "minMeasuredValue", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5602"),
    __metadata("design:type", Number)
], Sensor.prototype, "maxMeasuredValue", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5603"),
    __metadata("design:type", Number)
], Sensor.prototype, "minRangeValue", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5604"),
    __metadata("design:type", Number)
], Sensor.prototype, "maxRangeValue", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5605"),
    __metadata("design:type", Boolean)
], Sensor.prototype, "resetMinMaxMeasureValue", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5700"),
    __metadata("design:type", Number)
], Sensor.prototype, "sensorValue", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5701"),
    __metadata("design:type", String)
], Sensor.prototype, "unit", void 0);
exports.Sensor = Sensor;
