// TODO:
// - [ ] use multicast-dns package
// - [ ] manually cycle interfaces and set opts.interface (IPv6 with %<name> suffix)
// - [ ] use the following opts.ip: IPv4: 224.0.0.251, IPv6: FF02::FB

import { filter as objectFilter } from "alcalzone-shared/objects";
import * as mdns from "multicast-dns";
import { networkInterfaces } from "os";

export interface DiscoveredGateway {
	name: string;
	host?: string;
	version: string;
	addresses: string[];
}

function parseTXTRecord(data: Buffer) {
	const ret: Record<string, string> = {};
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
export function discoverGateway(timeout: number | false = 10000): Promise<DiscoveredGateway> {
	const allInterfaces = networkInterfaces();
	const externalInterfaces = objectFilter(allInterfaces, ifaces => {
		return ifaces.filter(addr => !addr.internal).length > 0;
	});
	const ipv4Interfaces = objectFilter(allInterfaces, addrs => {
		return addrs.filter(addr => addr.family === "IPv4").length > 0;
	});
	const ipv6Interfaces = objectFilter(allInterfaces, addrs => {
		return addrs.filter(addr => addr.family === "IPv6").length > 0;
	});

	const mdnsOptions: Partial<mdns.Options>[] = [];
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

	return new Promise((resolve, reject) => {
		for (const instance of mdnsInstances) {
			instance.on("response", (packet, rinfo) => {

			});
		}
		// TODO: Delete this
		resolve();
	});
}
