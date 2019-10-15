"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createMDNSServer = require("mdns-server");
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
/**
 * Auto-discover a tradfri gateway on the network.
 * @param timeout (optional) Time in milliseconds to wait for a response. Default 10000.
 * Pass false or a negative number to explicitly wait forever.
 */
function discoverGateway(timeout = 10000) {
    const mdns = createMDNSServer({
        reuseAddr: true,
        loopback: false,
        noInit: true,
    });
    let timer;
    const domain = "_coap._udp.local";
    return new Promise((resolve, reject) => {
        mdns.on("response", (resp) => {
            const allAnswers = [...resp.answers, ...resp.additionals];
            const discard = allAnswers.find(a => a.name === domain) == null;
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
            const match = /^gw\-[0-9a-f]{12}/.exec(ptrRecord.data);
            const name = !!match ? match[0] : "unknown";
            const host = srvRecord.data.target;
            const { version } = parseTXTRecord(txtRecord.data);
            const addresses = aRecords.map(a => a.data);
            clearTimeout(timer);
            mdns.destroy();
            resolve({
                name, host, version, addresses,
            });
        });
        mdns.on("ready", () => {
            mdns.query([
                { name: domain, type: "A" },
                { name: domain, type: "AAAA" },
                { name: domain, type: "PTR" },
                { name: domain, type: "SRV" },
                { name: domain, type: "TXT" },
            ]);
        });
        mdns.on("error", reject);
        mdns.initServer();
        if (typeof timeout === "number" && timeout > 0) {
            timer = setTimeout(() => {
                mdns.destroy();
                resolve(null);
            }, timeout);
        }
    });
}
exports.discoverGateway = discoverGateway;
