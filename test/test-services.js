// @ts-check

const { TradfriClient } = require("../");
const { Notification } = require("../build/lib/notification");
const { } = require("..")
const { wait } = require("../build/lib/promises");

async function main() {
	const tradfri = new TradfriClient("gw-b072bf257a41");

	await tradfri.connect("tradfri_1521372596997", "7Q9wWw84A7qJSthv");

	await tradfri.observeResource("15006", (resp) => {
		const notifications = JSON.parse(resp.payload.toString());
		for (const not of notifications) {
			const notification = new Notification().parse(not);
			console.log("got notification: " + JSON.stringify(notification));
		}
	});
	
	const {code, payload} = await tradfri.request("15011/9030", "post");
	console.log(code);
	//console.log(payload.toString("ascii")); //.replace(/,/g, ",\n"));

	await wait(10000);
	tradfri.destroy();
}
main();
