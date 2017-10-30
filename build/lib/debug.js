"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debugPackage = require("debug");
const _debug = debugPackage("node-tradfri-client");
function debug(message, severity = "info") {
    let prefix = "";
    if (severity !== "info") {
        prefix = `[${severity.toUpperCase()}] `;
    }
    _debug(`${prefix}${message}`);
}
exports.default = debug;
