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
class Notification extends ipsoObject_1.IPSOObject {
    constructor() {
        super(...arguments);
        this.timestamp = 0; // Timestamp of the notification as unix time
        this.event = 0;
        this.details = {};
        this.state = 0; // => ?
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
], Notification.prototype, "details", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9014"),
    __metadata("design:type", Number)
], Notification.prototype, "state", void 0);
exports.Notification = Notification;
var NotificationTypes;
(function (NotificationTypes) {
    NotificationTypes[NotificationTypes["NEW_FIRMWARE_AVAILABLE"] = 1001] = "NEW_FIRMWARE_AVAILABLE";
    NotificationTypes[NotificationTypes["GATEWAY_REBOOT_NOTIFICATION"] = 1003] = "GATEWAY_REBOOT_NOTIFICATION";
    NotificationTypes[NotificationTypes["UNKNOWN1"] = 1004] = "UNKNOWN1";
    NotificationTypes[NotificationTypes["UNKNOWN2"] = 1005] = "UNKNOWN2";
    NotificationTypes[NotificationTypes["LOSS_OF_INTERNET_CONNECTIVITY"] = 5001] = "LOSS_OF_INTERNET_CONNECTIVITY";
})(NotificationTypes = exports.NotificationTypes || (exports.NotificationTypes = {}));
var GatewayRebootReason;
(function (GatewayRebootReason) {
    GatewayRebootReason[GatewayRebootReason["REBOOT_DEFAULT"] = -1] = "REBOOT_DEFAULT";
    GatewayRebootReason[GatewayRebootReason["REBOOT_FIRMWARE_UPGRADE"] = 0] = "REBOOT_FIRMWARE_UPGRADE";
    GatewayRebootReason[GatewayRebootReason["REBOOT_FROM_CLIENT"] = 1] = "REBOOT_FROM_CLIENT";
    GatewayRebootReason[GatewayRebootReason["REBOOT_HOMEKIT_RESET"] = 3] = "REBOOT_HOMEKIT_RESET";
    GatewayRebootReason[GatewayRebootReason["REBOOT_SOFT_RESET"] = 2] = "REBOOT_SOFT_RESET";
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
