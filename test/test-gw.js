// @ts-check

const { TradfriClient } = require("../");
const { wait } = require("../build/lib/promises");

async function main() {
	const tradfri = new TradfriClient("gw-b072bf257a41");
	tradfri
		.on("gateway updated", (gw) => {
			console.log(new Date(gw.utcNowUnixTimestamp * 1000).toISOString());
			console.log(gw.utcNowISODate);
			// console.log(JSON.stringify(gw, null, 4))
		})
	;
	await tradfri.connect("tradfri_1521372596997", "7Q9wWw84A7qJSthv");
	
	await tradfri.observeGateway();

	await wait(10000);
	tradfri.destroy();
}
main();
