"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bonjourPackage = require("bonjour");
let bonjour;
/**
 * Auto-discover a tradfri gateway on the network.
 * @param timeout (optional) Time in milliseconds to wait for a response. Default 10000.
 * Pass false or a negative number to explicitly wait forever.
 */
function discoverGateway(timeout = 10000) {
    if (bonjour == null)
        bonjour = bonjourPackage();
    let timer;
    return new Promise((resolve, reject) => {
        const mdnsBrowser = bonjour.findOne({ type: "coap", protocol: "udp" }, (service) => {
            if (!service || !service.txt || !service.name.startsWith("gw-"))
                return;
            if (timer != null)
                clearTimeout(timer);
            const foundDevice = {
                name: service.name,
                version: service.txt.version,
                addresses: service.addresses,
            };
            resolve(foundDevice);
        });
        if (typeof timeout === "number" && timeout > 0) {
            timer = setTimeout(() => {
                if (mdnsBrowser != null)
                    mdnsBrowser.stop();
                resolve(null);
            }, timeout);
        }
        mdnsBrowser.start();
    });
}
exports.discoverGateway = discoverGateway;
