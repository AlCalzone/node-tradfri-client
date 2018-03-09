import * as bonjourPackage from "bonjour";
let bonjour: bonjourPackage.Bonjour;

export interface DiscoveredGateway {
	name: string;
	version: string;
	addresses: string[];
}

/**
 * Auto-discover a tradfri gateway on the network.
 * @param timeout (optional) Time in milliseconds to wait for a response. Default 10000. 
 * Pass false or a negative number to explicitly wait forever.
 */
export function discoverGateway(timeout: number | false = 10000): Promise<DiscoveredGateway> {
	if (bonjour == null) bonjour = bonjourPackage();
	let timer: NodeJS.Timer;

	return new Promise((resolve, reject) => {
		const mdnsBrowser = bonjour.findOne(
			{ type: "coap", protocol: "udp" },
			(service: any) => {
				if (!service || !service.txt || !service.name.startsWith("gw-")) return;

				if (timer != null) clearTimeout(timer);
				const foundDevice = {
					name: service.name,
					version: service.txt.version,
					addresses: service.addresses,
				};
				resolve(foundDevice);
			},
		);

		if (typeof timeout === "number" && timeout > 0) {
			timer = setTimeout(() => {
				if (mdnsBrowser != null) mdnsBrowser.stop();
				resolve(null);
			}, timeout);
		}
		
		mdnsBrowser.start();
	});
}
