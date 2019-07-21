// @ts-check

const { TradfriClient, discoverGateway } = require("../../build");
const { wait } = require("alcalzone-shared/async");

async function main() {
	const gwinfo = await discoverGateway();

	const tradfri = new TradfriClient(gwinfo.addresses[0]);
	tradfri
		.on("group updated", (group) => {
			// console.log(new Date(gw.utcNowUnixTimestamp * 1000).toISOString());
			console.dir(group);
			// console.log(JSON.stringify(gw, null, 4))
		})
	;
	await tradfri.connect("tradfri_1525499982376", "IvcPs9WMjCwkyXpj");

	await tradfri.observeGroupsAndScenes();

	await wait(60000);
	tradfri.destroy();
}
main();
