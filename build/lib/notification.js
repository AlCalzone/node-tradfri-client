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
const gatewayDetails_1 = require("./gatewayDetails");
const ipsoObject_1 = require("./ipsoObject");
class Notification extends ipsoObject_1.IPSOObject {
    constructor() {
        super(...arguments);
        this.timestamp = 0; // Timestamp of the notification as unix time
        this.event = 0;
        this._details = {};
        this.isActive = false;
    }
    get details() {
        return this.event === NotificationTypes.Reboot ? (new RebootNotification().parse(this._details))
            : this.event === NotificationTypes.NewFirmwareAvailable ? (new FirmwareUpdateNotification().parse(this._details))
                : this._details;
    }
    toJSON() {
        return {
            timestamp: this.timestamp,
            event: NotificationTypes[this.event],
            details: this.details,
            isActive: this.isActive,
        };
    }
}
__decorate([
    ipsoObject_1.ipsoKey("9002"),
    __metadata("design:type", Number)
], Notification.prototype, "timestamp", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9015"),
    __metadata("design:type", Number)
], Notification.prototype, "event", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9017"),
    ipsoObject_1.deserializeWith(arr => parseNotificationDetails(arr), { splitArrays: false }),
    __metadata("design:type", Object)
], Notification.prototype, "_details", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9014"),
    __metadata("design:type", Boolean)
], Notification.prototype, "isActive", void 0);
exports.Notification = Notification;
// These classes are only read, so their properties must be defined
class RebootNotification extends ipsoObject_1.IPSOObject {
    toJSON() {
        return {
            reason: GatewayRebootReason[this.reason],
        };
    }
}
__decorate([
    ipsoObject_1.ipsoKey("9052"),
    __metadata("design:type", Number)
], RebootNotification.prototype, "reason", void 0);
exports.RebootNotification = RebootNotification;
class FirmwareUpdateNotification extends ipsoObject_1.IPSOObject {
    toJSON() {
        return {
            releaseNotes: this.releaseNotes,
            priority: gatewayDetails_1.UpdatePriority[this.priority],
        };
    }
}
__decorate([
    ipsoObject_1.ipsoKey("9056"),
    __metadata("design:type", String)
], FirmwareUpdateNotification.prototype, "releaseNotes", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9066"),
    ipsoObject_1.deserializeWith(str => parseInt(str, 10)),
    __metadata("design:type", Number)
], FirmwareUpdateNotification.prototype, "priority", void 0);
exports.FirmwareUpdateNotification = FirmwareUpdateNotification;
var NotificationTypes;
(function (NotificationTypes) {
    NotificationTypes[NotificationTypes["NewFirmwareAvailable"] = 1001] = "NewFirmwareAvailable";
    NotificationTypes[NotificationTypes["Reboot"] = 1003] = "Reboot";
    NotificationTypes[NotificationTypes["UNKNOWN1"] = 1004] = "UNKNOWN1";
    NotificationTypes[NotificationTypes["UNKNOWN2"] = 1005] = "UNKNOWN2";
    NotificationTypes[NotificationTypes["LossOfInternetConnectivity"] = 5001] = "LossOfInternetConnectivity";
})(NotificationTypes = exports.NotificationTypes || (exports.NotificationTypes = {}));
var GatewayRebootReason;
(function (GatewayRebootReason) {
    GatewayRebootReason[GatewayRebootReason["default"] = -1] = "default";
    GatewayRebootReason[GatewayRebootReason["firmware upgrade"] = 0] = "firmware upgrade";
    GatewayRebootReason[GatewayRebootReason["initiated by client"] = 1] = "initiated by client";
    GatewayRebootReason[GatewayRebootReason["homekit reset"] = 3] = "homekit reset";
    GatewayRebootReason[GatewayRebootReason["factory reset"] = 2] = "factory reset";
})(GatewayRebootReason = exports.GatewayRebootReason || (exports.GatewayRebootReason = {}));
/**
 * Turns a key=value-Array into a Dictionary object
 */
function parseNotificationDetails(kvpList) {
    const ret = {};
    for (const kvp of kvpList) {
        const parts = kvp.split("=");
        ret[parts[0]] = parts[1];
    }
    return ret;
}
