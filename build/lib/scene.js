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
const lightSetting_1 = require("./lightSetting");
class Scene extends ipsoDevice_1.IPSODevice {
    constructor() {
        super(...arguments);
        this.isActive = false; // <bool>
        this.isPredefined = true; // <bool>
        // Plugs can be part of a scene but we need to find out how they are included
        // I currently believe, they are part of this, as LightSettings are a superset
        // of the available settings for plugs.
        this.lightSettings = [];
        this.sceneIndex = 0; // <int>
        this.useCurrentLightSettings = false; // <bool>
    }
}
__decorate([
    ipsoObject_1.ipsoKey("9058"),
    __metadata("design:type", Boolean)
], Scene.prototype, "isActive", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9068"),
    __metadata("design:type", Boolean)
], Scene.prototype, "isPredefined", void 0);
__decorate([
    ipsoObject_1.ipsoKey("15013"),
    ipsoObject_1.deserializeWith(obj => new lightSetting_1.LightSetting().parse(obj)),
    __metadata("design:type", Array)
], Scene.prototype, "lightSettings", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9057"),
    __metadata("design:type", Number)
], Scene.prototype, "sceneIndex", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9070"),
    __metadata("design:type", Boolean)
], Scene.prototype, "useCurrentLightSettings", void 0);
exports.Scene = Scene;
