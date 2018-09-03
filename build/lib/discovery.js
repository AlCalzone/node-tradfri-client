"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objects_1 = require("alcalzone-shared/objects");
const mdns = require("multicast-dns");
const os_1 = require("os");
function parseTXTRecord(data) {
    const ret = {};
    let offset = 0;
    while (offset < data.length) {
        const length = data[offset];
        const label = data.slice(offset + 1, offset + 1 + length).toString("ascii");
        const [key, value] = label.split("=");
        ret[key] = value;
        offset += length;
    }
    return ret;
}
// tslint:disable-next-line:variable-name
const IPv6_MULTICAST_ADDRESS = "ff02::fb";
const COAP_DOMAIN = "_coap._udp.local";
/**
 * Auto-discover a tradfri gateway on the network.
 * @param timeout (optional) Time in milliseconds to wait for a response. Default 10000.
 * Pass false or a negative number to explicitly wait forever.
 */
function discoverGateway(timeout = 10000) {
    const allInterfaces = os_1.networkInterfaces();
    const externalInterfaces = objects_1.filter(allInterfaces, ifaces => {
        return ifaces.filter(addr => !addr.internal).length > 0;
    });
    const ipv4Interfaces = objects_1.filter(allInterfaces, addrs => {
        return addrs.filter(addr => addr.family === "IPv4").length > 0;
    });
    const ipv6Interfaces = objects_1.filter(allInterfaces, addrs => {
        return addrs.filter(addr => addr.family === "IPv6").length > 0;
    });
    const mdnsOptions = [];
    if (Object.keys(ipv4Interfaces).length > 0) {
        // we have IPv4 interfaces, so create a listener for them
        mdnsOptions.push({
            interface: "0.0.0.0",
            type: "udp4",
        });
    }
    for (const iface of Object.keys(ipv6Interfaces)) {
        mdnsOptions.push({
            interface: `::%${iface}`,
            type: "udp6",
            ip: IPv6_MULTICAST_ADDRESS,
        });
    }
    // create all the mdns instances
    const mdnsInstances = mdnsOptions.map(opts => mdns(opts));
    function destroyInstances() {
        mdnsInstances.forEach(inst => inst.destroy());
    }
    return new Promise((resolve, reject) => {
        let timer;
        for (const instance of mdnsInstances) {
            instance.on("response", (packet, rinfo) => {
                const allAnswers = [...packet.answers, ...packet.additionals];
                const discard = allAnswers.find(a => a.name === COAP_DOMAIN) == null;
                if (discard)
                    return;
                // ensure all record types were received
                const ptrRecord = allAnswers.find(a => a.type === "PTR");
                if (!ptrRecord)
                    return;
                const srvRecord = allAnswers.find(a => a.type === "SRV");
                if (!srvRecord)
                    return;
                const txtRecord = allAnswers.find(a => a.type === "TXT");
                if (!txtRecord)
                    return;
                const aRecords = allAnswers.filter(a => a.type === "A" || a.type === "AAAA");
                if (aRecords.length === 0)
                    return;
                // extract the data
                const name = /^gw\-[0-9a-f]{12}/.exec(ptrRecord.data)[0];
                const host = srvRecord.data.target;
                const { version } = parseTXTRecord(txtRecord.data);
                const addresses = aRecords.map(a => a.data);
                if (timer != null)
                    clearTimeout(timer);
                destroyInstances();
                resolve({
                    name, host, version, addresses,
                });
            });
            instance.on("ready", () => {
                instance.query([
                    { name: COAP_DOMAIN, type: "A" },
                    { name: COAP_DOMAIN, type: "AAAA" },
                    { name: COAP_DOMAIN, type: "PTR" },
                    { name: COAP_DOMAIN, type: "SRV" },
                    { name: COAP_DOMAIN, type: "TXT" },
                ]);
            });
        }
        if (typeof timeout === "number" && timeout > 0) {
            timer = setTimeout(() => {
                destroyInstances();
                resolve(null);
            }, timeout);
        }
    });
}
exports.discoverGateway = discoverGateway;
