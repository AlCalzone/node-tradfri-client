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
/** contains information about the gateway */
/* istanbul ignore next */
class GatewayDetails extends ipsoObject_1.IPSOObject {
    constructor() {
        // All properties only exist after the light has been received from the gateway
        // so they are definitely assigned!
        super(...arguments);
        this.commissioningMode = 0; // some enum => which one?
        this.utcNowUnixTimestamp = 0;
        this.utcNowISODate = "";
        this.timeSource = -1; // <int>
        this.ntpServerUrl = "";
        this.version = "";
        this.UNKNOWN_9062 = 0; // <int> => something more with commissioning?
        this.updateProgress = 100; // <int>
        this.updatePriority = UpdatePriority.Normal;
        this.updateAcceptedTimestamp = 0; // <int>
        this.releaseNotes = ""; // <string> => what is this?
        this.dstStartMonth = 0;
        this.dstStartDay = 0;
        this.dstStartHour = 0;
        this.dstStartMinute = 0;
        this.dstEndMonth = 0;
        this.dstEndDay = 0;
        this.dstEndHour = 0;
        this.dstEndMinute = 0;
        this.dstTimeOffset = 0;
        this.UNKNOWN_9081 = ""; // some kind of hex code
        // are those used?
        this.forceOtaUpdateCheck = "";
        this.name = "";
    }
}
__decorate([
    ipsoObject_1.ipsoKey("9093"),
    __metadata("design:type", Boolean)
], GatewayDetails.prototype, "alexaPairStatus", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9105"),
    __metadata("design:type", Boolean)
], GatewayDetails.prototype, "googleHomePairStatus", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9093"),
    __metadata("design:type", Boolean)
], GatewayDetails.prototype, "certificateProvisioned", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9061"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "commissioningMode", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9059"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "utcNowUnixTimestamp", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9060"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "utcNowISODate", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9071"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "timeSource", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9023"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "ntpServerUrl", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9029"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "version", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9062"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN_9062", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9054"),
    __metadata("design:type", Boolean)
], GatewayDetails.prototype, "otaUpdateState", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9055"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "updateProgress", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9066"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "updatePriority", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9069"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "updateAcceptedTimestamp", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9056"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "releaseNotes", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9072"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "dstStartMonth", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9073"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "dstStartDay", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9074"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "dstStartHour", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9075"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "dstStartMinute", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9076"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "dstEndMonth", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9077"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "dstEndDay", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9078"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "dstEndHour", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9079"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "dstEndMinute", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9080"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "dstTimeOffset", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9081"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "UNKNOWN_9081", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9082"),
    __metadata("design:type", Boolean)
], GatewayDetails.prototype, "UNKNOWN_9082", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9083"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "UNKNOWN_9083", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9092"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN_9092", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9106"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN_9106", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9032"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "forceOtaUpdateCheck", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9035"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "name", void 0);
exports.GatewayDetails = GatewayDetails;
var UpdatePriority;
(function (UpdatePriority) {
    UpdatePriority[UpdatePriority["Normal"] = 0] = "Normal";
    UpdatePriority[UpdatePriority["Critical"] = 1] = "Critical";
    UpdatePriority[UpdatePriority["Required"] = 2] = "Required";
    UpdatePriority[UpdatePriority["Forced"] = 5] = "Forced";
})(UpdatePriority = exports.UpdatePriority || (exports.UpdatePriority = {}));
