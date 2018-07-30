const mdns = require("mdns-server")({
	reuseAddr: true,
	loopback: false,
});

const coap = "_coap._udp.local";

mdns.on("response", resp => {
	const allAnswers = [...resp.answers, ...resp.additionals];
	const discard = allAnswers.find(a => a.name === coap) == null;
	if (!discard) {
		// console.dir({opcode: resp.opcode, answers: allAnswers.map(a => a.name)});
		console.dir(resp, {depth: 999});
	}
});

mdns.query([
	{name: coap, type: "A"},
	{name: coap, type: "AAAA"},
	{name: coap, type: "TXT"},
	{name: coap, type: "SRV"},
	{name: coap, type: "PTR"},
]);

process.on("exit", () => {
	mdns.destroy();
});
