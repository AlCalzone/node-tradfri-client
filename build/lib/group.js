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
class Group extends ipsoDevice_1.IPSODevice {
}
__decorate([
    ipsoObject_1.ipsoKey("5850"),
    __metadata("design:type", Boolean)
], Group.prototype, "onOff", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5851"),
    ipsoObject_1.serializeWith(conversions_1.serializers.brightness),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.brightness),
    __metadata("design:type", Number)
], Group.prototype, "dimmer", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9039"),
    __metadata("design:type", Number)
], Group.prototype, "sceneId", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9018"),
    ipsoObject_1.deserializeWith(obj => parseAccessoryLink(obj)),
    ipsoObject_1.serializeWith(ids => toAccessoryLink(ids), false),
    __metadata("design:type", Array)
], Group.prototype, "deviceIDs", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5712"),
    ipsoObject_1.required,
    ipsoObject_1.serializeWith(conversions_1.serializers.transitionTime),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.transitionTime),
    __metadata("design:type", Number)
], Group.prototype, "transitionTime", void 0);
exports.Group = Group;
// TODO: Type annotation
function parseAccessoryLink(link) {
    const hsLink = link["15002"];
    const deviceIDs = hsLink["9003"];
    return deviceIDs;
}
function toAccessoryLink(ids) {
    return {
        15002: {
            9003: ids,
        },
    };
}
