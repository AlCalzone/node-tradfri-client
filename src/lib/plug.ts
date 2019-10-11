// wotan-disable no-useless-predicate
// Until I'm sure that the properties may be nullable, we have to allow these "useless" checks

import { clamp } from "alcalzone-shared/math";
import { Accessory } from "./accessory";
import { deserializers, serializers } from "./conversions";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, doNotSerialize, ipsoKey, IPSOOptions, serializeWith } from "./ipsoObject";

export type PlugOperation = Partial<Pick<Plug,
	"onOff" | "dimmer"
	>>;

export class Plug extends IPSODevice {

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

	@ipsoKey("5805")
	public cumulativeActivePower: number = 0.0; // <float>

	@ipsoKey("5851")
	@serializeWith(serializers.brightness)
	@deserializeWith(deserializers.brightness)
	public dimmer: number = 0; // <int> [0..100]

	@ipsoKey("5850")
	public onOff: boolean = false;

	@ipsoKey("5852")
	public onTime: number = 0; // <int>

	@ipsoKey("5820")
	public powerFactor: number = 0.0; // <float>

	// TODO: no unit???
	// @ipsoKey("5701")
	// public unit: string = "";

	/**
	 * Returns true if the current plug is dimmable
	 */
	public get isDimmable(): boolean {
		return false; // we know no plugs that are dimmable
	}

	/**
	 * Returns true if the current plug is switchable
	 */
	public get isSwitchable(): boolean {
		return true; // we know no plugs that aren't switchable
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

	/** Turn this plug on */
	public turnOn(): Promise<boolean> {
		return this.operatePlug( { onOff: true });
	}

	/** Turn this plug off */
	public turnOff(): Promise<boolean> {
		return this.operatePlug({ onOff: false });
	}

	/** Toggles this plug on or off */
	public toggle(value: boolean = !this.onOff): Promise<boolean> {
		return this.operatePlug({ onOff: value });
	}

	private operatePlug(operation: PlugOperation): Promise<boolean> {
		this.ensureLink();
		return this.client!.operatePlug(this._accessory!, operation);
	}

	/**
	 * Changes this plug's "brightness". Any value > 0 turns the plug on, 0 turns it off.
	 * @returns true if a request was sent, false otherwise
	 */
	public setBrightness(value: number): Promise<boolean> {
		value = clamp(value, 0, 100);
		return this.operatePlug({ dimmer: value });
	}

	/** Turns this object into JSON while leaving out the potential circular reference */
	public toJSON(): {} {
		return {
			onOff: this.onOff,
			isDimmable: this.isDimmable,
			isSwitchable: this.isSwitchable
		};
	}
}
