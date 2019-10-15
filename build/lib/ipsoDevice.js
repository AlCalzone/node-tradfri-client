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
// common base class for all devices
class IPSODevice extends ipsoObject_1.IPSOObject {
    constructor() {
        super(...arguments);
        this.name = "";
        this.createdAt = 0;
        this.instanceId = 0;
    }
}
__decorate([
    ipsoObject_1.ipsoKey("9001"),
    __metadata("design:type", String)
], IPSODevice.prototype, "name", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9002"),
    __metadata("design:type", Number)
], IPSODevice.prototype, "createdAt", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9003"),
    __metadata("design:type", Number)
], IPSODevice.prototype, "instanceId", void 0);
exports.IPSODevice = IPSODevice;
