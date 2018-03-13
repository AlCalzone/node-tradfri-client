"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TradfriErrorCodes;
(function (TradfriErrorCodes) {
    TradfriErrorCodes[TradfriErrorCodes["ConnectionFailed"] = 0] = "ConnectionFailed";
    TradfriErrorCodes[TradfriErrorCodes["AuthenticationFailed"] = 1] = "AuthenticationFailed";
    TradfriErrorCodes[TradfriErrorCodes["NetworkReset"] = 2] = "NetworkReset";
})(TradfriErrorCodes = exports.TradfriErrorCodes || (exports.TradfriErrorCodes = {}));
class TradfriError extends Error {
    constructor(message, code) {
        super(message);
        this.message = message;
        this.code = code;
        // We need to set the prototype explicitly
        Object.setPrototypeOf(this, TradfriError.prototype);
    }
}
exports.TradfriError = TradfriError;
