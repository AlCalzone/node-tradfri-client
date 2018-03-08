import * as bonjourPackage from "bonjour";
const bonjour = bonjourPackage();

export interface DiscoveredGateway {
	name: string;
	version: string;
	addresses: string[];
}

export function discoverGateway(): Promise<DiscoveredGateway> {
	return new Promise((resolve, reject) => {
		const mdnsBrowser = bonjour.findOne(
			{ type: "coap", protocol: "udp" },
			(service: any) => {
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
			},
		);
		mdnsBrowser.start();
	});
}
