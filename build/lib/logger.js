"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debugPackage = require("debug");
const _debug = debugPackage("node-tradfri-client");
function defaultLogger(message, severity = "info") {
    let prefix = "";
    if (severity !== "info") {
        prefix = `[${severity.toUpperCase()}] `;
    }
    _debug(`${prefix}${message}`);
}
let customLogger;
function setCustomLogger(logger) {
    customLogger = logger;
}
exports.setCustomLogger = setCustomLogger;
function log(message, severity = "info") {
    (customLogger || defaultLogger)(message, severity);
}
exports.log = log;
