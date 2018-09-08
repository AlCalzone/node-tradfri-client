const TradfriClient = require("../../").TradfriClient;

async function main() {
	const tradfri = new TradfriClient("gw-b072bf257a41", {watchConnection: {
		pingInterval: 2000,
		failedPingBackoffFactor: 1,
		// maximumReconnects: 3,
		failedPingCountUntilOffline: 3,
		connectionInterval: 10000,
		failedConnectionBackoffFactor: 1.2,
		maximumConnectionAttempts: 5,
	}});
	tradfri
		.on("ping failed", (count) => console.log(`${count} pings failed`))
		.on("ping succeeded", () => console.log("ping succeeded"))
		.on("connection lost", () => console.log("connection lost"))
		.on("connection failed", (att, max) => console.log(`connection failed: attempt ${att} of ${max}`))
		.on("connection alive", () => console.log("connection alive"))
		.on("gateway offline", () => console.log("gateway offline"))
		.on("reconnecting", (att, max) => console.log(`reconnect attempt ${att} of ${max}`))
		.on("give up", () => console.log("giving up..."))
	;
	await tradfri.connect("tradfri_1509642359115", "gzqZY5HUlFOOVu9f");
	
	tradfri.on("device updated", (acc) => console.log(`device with ID ${acc.instanceId} updated...`));
	await tradfri.observeDevices();
}
main();
