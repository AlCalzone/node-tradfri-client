declare module "mdns-server" {

	import { EventEmitter } from "events";

	interface Response {
		answers: any[];
		additionals: any[];
	}

	type MDnsPackage = (options: any) => MDnsInstance;

	interface MDnsInstance extends EventEmitter {
		on(event: "response", handler: (resp: Response) => void): this;
		on(event: "ready", handler: () => void): this;
		on(event: "error", handler: (e: Error) => void): this;
		query(...args: any[]): void;
		destroy(): void;
		initServer(): void;
	}

	const package: MDnsPackage;
	export = package;
}
