import * as debugPackage from "debug";
const _debug = debugPackage("node-tradfri-client");

export default function debug(message: string, severity: "info" | "warn" | "debug" | "error" | "silly" = "info") {
	let prefix: string = "";
	if (severity !== "info") {
		prefix = `[${severity.toUpperCase()}] `;
	}
	_debug(`${prefix}${message}`);
}
