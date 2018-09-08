// @ts-check

const { TradfriClient } = require("../../");
const { Notification } = require("../../build/lib/notification");
const { wait } = require("alcalzone-shared/async");

async function main() {
	const tradfri = new TradfriClient("gw-b072bf257a41");

	await tradfri.connect("tradfri_1525499982376", "IvcPs9WMjCwkyXpj");

	tradfri
		.on("internet connectivity changed", connected => {console.log(connected ? "internet available" : "internet down")})
		.on("rebooting", reason => console.log(`rebooting because ${reason}`))
		.on("firmware update available", (url, priority) =>console.log(`update available (${url}) with prio ${priority}`))
	;
	await tradfri.observeNotifications();

	// await tradfri.observeResource("15006", (resp) => {
	// 	const notifications = JSON.parse(resp.payload.toString());
	// 	for (const not of notifications) {
	// 		const notification = new Notification().parse(not);
	// 		console.log("got notification: " + JSON.stringify(notification));
	// 	}
	// });
	
	await tradfri.rebootGateway();

	await wait(20000);
	tradfri.destroy();
}
main();
