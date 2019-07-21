// @ts-check

const { TradfriClient, discoverGateway } = require("../../build");
const { wait } = require("alcalzone-shared/async");

async function main() {
	const gwinfo = await discoverGateway();

	const tradfri = new TradfriClient(
		gwinfo.addresses[0],
		(msg, sev) => sev !== "silly" && console.error(msg)
	);

	await tradfri.connect("tradfri_1525499982376", "IvcPs9WMjCwkyXpj");

	await tradfri.observeDevices();

	tradfri
		// @ts-ignore
		.on("device updated", ({ client, ...dev }) => {
			const stack = new Error().stack;
			console.log(stack);
			// console.log(new Date(gw.utcNowUnixTimestamp * 1000).toISOString());
			console.dir(dev);
			// console.log(JSON.stringify(gw, null, 4))
		});

	await wait(1000);

	for (const i of [1, 2, 3]) {
		console.error();
		console.error("SWITCHING");
		console.error();

			await tradfri.operateLight(tradfri.devices[65538], {
			dimmer: Math.random() * 100
		});

		await wait(1000);
	}

	tradfri.destroy();
}
main();
