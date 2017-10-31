import * as debugPackage from "debug";
const _debug = debugPackage("node-tradfri-client");

export type LoggerFunction = (message: string, severity?: "info" | "warn" | "debug" | "error" | "silly") => void;

function defaultLogger(message: string, severity: "info" | "warn" | "debug" | "error" | "silly" = "info") {
	let prefix: string = "";
	if (severity !== "info") {
		prefix = `[${severity.toUpperCase()}] `;
	}
	_debug(`${prefix}${message}`);
}
let customLogger: LoggerFunction;
export function setCustomLogger(logger: LoggerFunction): void {
	customLogger = logger;
}

export function log(message: string, severity: "info" | "warn" | "debug" | "error" | "silly" = "info") {
	(customLogger || defaultLogger)(message, severity);
}
