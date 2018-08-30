// TODO:
// - [ ] use multicast-dns package
// - [ ] manually cycle interfaces and set opts.interface (IPv6 with %<name> suffix)
// - [ ] use the following opts.ip: IPv4: 224.0.0.251, IPv6: FF02::FB

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

/**
 * Auto-discover a tradfri gateway on the network.
 * @param timeout (optional) Time in milliseconds to wait for a response. Default 10000.
 * Pass false or a negative number to explicitly wait forever.
 */
export function discoverGateway(timeout: number | false = 10000): Promise<DiscoveredGateway> {
	const allInterfaces = networkInterfaces();
	return null!;
}
