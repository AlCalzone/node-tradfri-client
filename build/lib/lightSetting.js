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
class LightSetting extends ipsoDevice_1.IPSODevice {
    constructor() {
        super(...arguments);
        this.color = "f1e0b5"; // hex string
        this.hue = 0; // [0-359]
        this.saturation = 0; // [0..100%]
        this.colorX = 0; // int
        this.colorY = 0; // int
        this.colorTemperature = 0; // TODO: range unknown!
        this.dimmer = 0; // <int> [0..100]
        this.onOff = false; // <bool>
    }
}
__decorate([
    ipsoObject_1.ipsoKey("5706"),
    __metadata("design:type", String)
], LightSetting.prototype, "color", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5707"),
    __metadata("design:type", Number)
], LightSetting.prototype, "hue", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5708"),
    __metadata("design:type", Number)
], LightSetting.prototype, "saturation", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5709"),
    __metadata("design:type", Number)
], LightSetting.prototype, "colorX", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5710"),
    __metadata("design:type", Number)
], LightSetting.prototype, "colorY", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5711"),
    __metadata("design:type", Number)
], LightSetting.prototype, "colorTemperature", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5851"),
    ipsoObject_1.serializeWith(conversions_1.serializers.brightness),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.brightness),
    __metadata("design:type", Number)
], LightSetting.prototype, "dimmer", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5850"),
    __metadata("design:type", Boolean)
], LightSetting.prototype, "onOff", void 0);
exports.LightSetting = LightSetting;
