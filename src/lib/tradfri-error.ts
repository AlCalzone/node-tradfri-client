export enum TradfriErrorCodes {
	ConnectionFailed,
}

export class TradfriError extends Error {
	constructor(
		public readonly message: string,
		public readonly code: TradfriErrorCodes,
	) {
		super(message);

		// We need to set the prototype explicitly
		Object.setPrototypeOf(this, TradfriError.prototype);
	}
}
