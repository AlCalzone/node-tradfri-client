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
const conversions_1 = require("./conversions");
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
/* istanbul ignore next */
class Plug extends ipsoDevice_1.IPSODevice {
    constructor() {
        super(...arguments);
        this.cumulativeActivePower = 0.0; // <float>
        this.dimmer = 0; // <int> [0..100]
        this.onOff = false;
        this.onTime = 0; // <int>
        this.powerFactor = 0.0; // <float>
        // TODO: no unit???
        // @ipsoKey("5701")
        // public unit: string = "";
    }
}
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
