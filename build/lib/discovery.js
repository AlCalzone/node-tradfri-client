"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bonjourPackage = require("bonjour");
const bonjour = bonjourPackage();
function discoverGateway() {
    return new Promise((resolve, reject) => {
        const mdnsBrowser = bonjour.findOne({ type: "coap", protocol: "udp" }, (service) => {
            if (!service || !service.txt || !service.name.startsWith("gw-")) {
                return;
            }
            const foundDevice = {
                name: service.name,
                version: service.txt.version,
                addresses: service.addresses,
            };
            mdnsBrowser.stop();
            resolve(foundDevice);
        });
        mdnsBrowser.start();
    });
}
exports.discoverGateway = discoverGateway;
