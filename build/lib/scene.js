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
exports.Scene = void 0;
const airPurifierSetting_1 = require("./airPurifierSetting");
const blindSetting_1 = require("./blindSetting");
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
const lightSetting_1 = require("./lightSetting");
const plugSetting_1 = require("./plugSetting");
class Scene extends ipsoDevice_1.IPSODevice {
    constructor() {
        super(...arguments);
        this.isActive = false; // <bool>
        this.isPredefined = true; // <bool>
        this.lightSettings = [];
        this.blindSettings = [];
        this.plugSettings = [];
        this.airPurifierSettings = [];
        this.sceneIndex = 0; // <int>
        this.sceneIconId = 0; // <int>
        this.coapVersion = "";
        this.useCurrentLightSettings = false; // <bool>
    }
}
__decorate([
    (0, ipsoObject_1.ipsoKey)("9058"),
    __metadata("design:type", Boolean)
], Scene.prototype, "isActive", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("9068"),
    __metadata("design:type", Boolean)
], Scene.prototype, "isPredefined", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("15013"),
    (0, ipsoObject_1.deserializeWith)(obj => new lightSetting_1.LightSetting().parse(obj)),
    __metadata("design:type", Array)
], Scene.prototype, "lightSettings", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("15016"),
    (0, ipsoObject_1.deserializeWith)(obj => new blindSetting_1.BlindSetting().parse(obj)),
    __metadata("design:type", Array)
], Scene.prototype, "blindSettings", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("15021"),
    (0, ipsoObject_1.deserializeWith)(obj => new plugSetting_1.PlugSetting().parse(obj)),
    __metadata("design:type", Array)
], Scene.prototype, "plugSettings", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("15026"),
    (0, ipsoObject_1.deserializeWith)(obj => new airPurifierSetting_1.AirPurifierSetting().parse(obj)),
    __metadata("design:type", Array)
], Scene.prototype, "airPurifierSettings", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("9057"),
    __metadata("design:type", Number)
], Scene.prototype, "sceneIndex", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("9109"),
    ipsoObject_1.doNotSerialize,
    __metadata("design:type", Number)
], Scene.prototype, "sceneIconId", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("9203"),
    ipsoObject_1.doNotSerialize,
    __metadata("design:type", String)
], Scene.prototype, "coapVersion", void 0);
__decorate([
    (0, ipsoObject_1.ipsoKey)("9070"),
    __metadata("design:type", Boolean)
], Scene.prototype, "useCurrentLightSettings", void 0);
exports.Scene = Scene;
