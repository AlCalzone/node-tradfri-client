declare module "mdns-server" {

	import { EventEmitter } from "events";

	interface Response {
		answers: any[];
		additionals: any[];
	}

	interface MDnsPackage {
		(options: any): MDnsInstance;
	}

	interface MDnsInstance extends EventEmitter {
		on(event: "response", handler: (resp: Response) => void): this;
		on(event: "ready", handler: () => void): this;
		query(...args: any[]): void;
		destroy(): void;
	}

	const package: MDnsPackage;
	export = package;
}
