// @ts-check

const { TradfriClient, discoverGateway } = require("../../");
const { wait } = require("alcalzone-shared/async");

async function main() {
	const gwinfo = await discoverGateway();
	console.dir(gwinfo);
	process.exit(0);
	const tradfri = new TradfriClient(gwinfo.addresses[0]);
	tradfri
		.on("gateway updated", (gw) => {
			console.log(new Date(gw.utcNowUnixTimestamp * 1000).toISOString());
			console.log(gw.utcNowISODate);
			// console.log(JSON.stringify(gw, null, 4))
		})
	;
	await tradfri.connect("tradfri_1525499982376", "IvcPs9WMjCwkyXpj");

	await tradfri.observeGateway();

	await wait(10000);
	tradfri.destroy();
}
main();
