// wotan-disable no-useless-predicate
// Until I'm sure that the properties may be nullable, we have to allow these "useless" checks

import { clamp } from "alcalzone-shared/math";
import { Accessory } from "./accessory";
import { IPSODevice } from "./ipsoDevice";
import { doNotSerialize, ipsoKey, IPSOOptions } from "./ipsoObject";

export type BlindOperation = Partial<Pick<Blind,
	"position"
>>;

export class Blind extends IPSODevice {

	constructor(options?: IPSOOptions, accessory?: Accessory) {
		super(options);

		// In order for the simplified API to work, the
		// accessory reference must be a proxy
		if (accessory != null && !accessory.isProxy) {
			accessory = accessory.createProxy();
		}
		this._accessory = accessory;

		// get the model number to detect features
		if (accessory != null &&
			accessory.deviceInfo != null &&
			accessory.deviceInfo.modelNumber != null &&
			accessory.deviceInfo.modelNumber.length > 0
		) {
			this._modelName = accessory.deviceInfo.modelNumber;
		}
	}

	@doNotSerialize private _modelName: string | undefined;
	@doNotSerialize private _accessory: Accessory | undefined;

	@ipsoKey("5536")
	public position: number = 0.0; // <float>

	/**
	 * Returns true if the current blind is dimmable
	 */
	public get isDimmable(): boolean {
		return true; // we know no blinds that are dimmable
	}

	/**
	 * Returns true if the current blind is switchable
	 */
	public get isSwitchable(): boolean {
		return false; // we know no blinds that aren't switchable
	}

	public clone(): this {
		const ret = super.clone(this._accessory);
		ret._modelName = this._modelName;
		return ret;
	}

	/**
	 * Creates a proxy which redirects the properties to the correct internal one, does nothing now
	 */
	public createProxy(): this {
		return this;
	}

	// =================================
	// Simplified API access
	/**
	 * Ensures this instance is linked to a tradfri client and an accessory
	 * @throws Throws an error if it isn't
	 */
	private ensureLink() {
		if (this.client == null) {
			throw new Error("Cannot use the simplified API on devices which aren't linked to a client instance.");
		}
		if (!(this._accessory instanceof Accessory)) {
			throw new Error("Cannot use the simplified API on plugs which aren't linked to an Accessory instance.");
		}
	}

	/** Open these blinds */
	public open(): Promise<boolean> {
		return this.operateBlind({ position: 100 }); // TODO: is this the right way around?
	}

	/** Close these blinds */
	public close(): Promise<boolean> {
		return this.operateBlind({ position: 0 }); // TODO: is this the right way around?
	}

	private operateBlind(operation: BlindOperation): Promise<boolean> {
		this.ensureLink();
		return this.client!.operateBlind(this._accessory!, operation);
	}

	/**
	 * Changes this plug's "brightness". Any value > 0 turns the plug on, 0 turns it off.
	 * @returns true if a request was sent, false otherwise
	 */
	public setPosition(value: number): Promise<boolean> {
		value = clamp(value, 0, 100);
		return this.operateBlind({ position: value });
	}

	/** Turns this object into JSON while leaving out the potential circular reference */
	public toJSON(): {} {
		return {
			position: this.position,
		};
	}
}
