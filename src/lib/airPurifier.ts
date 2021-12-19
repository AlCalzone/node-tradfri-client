import { Accessory } from "./accessory";
import { deserializers, serializers } from "./conversions";
import { IPSODevice } from "./ipsoDevice";
import {
	deserializeWith,
	doNotSerialize,
	ipsoKey,
	IPSOOptions,
	serializeWith,
} from "./ipsoObject";

export enum FanMode {
	Off = 0,
	Auto = 1,
	Level1 = 10,
	Level2 = 20,
	Level3 = 30,
	Level4 = 40,
	Level5 = 50,
}

export type AirPurifierOperation = Partial<
	Pick<AirPurifier, "controlsLocked" | "fanMode" | "fanSpeed" | "statusLEDs">
>;

export class AirPurifier extends IPSODevice {
	constructor(options?: IPSOOptions, accessory?: Accessory) {
		super(options);

		// In order for the simplified API to work, the
		// accessory reference must be a proxy
		if (accessory != null && !accessory.isProxy) {
			accessory = accessory.createProxy();
		}
		this._accessory = accessory;

		// get the model number to detect features
		if (
			accessory != null &&
			accessory.deviceInfo != null &&
			accessory.deviceInfo.modelNumber != null &&
			accessory.deviceInfo.modelNumber.length > 0
		) {
			this._modelName = accessory.deviceInfo.modelNumber;
		}
	}

	@doNotSerialize private _modelName: string | undefined;
	@doNotSerialize private _accessory: Accessory | undefined;

	@ipsoKey("5907")
	public airQuality: number | undefined = 0; // <int> [0..100] / 0xffff

	@ipsoKey("5905")
	public controlsLocked: boolean = false;

	@ipsoKey("5900")
	public fanMode: FanMode = FanMode.Off;
	@ipsoKey("5908")
	@serializeWith(serializers.fanSpeed, { neverSkip: true })
	public fanSpeed: number = 0;

	@ipsoKey("5904")
	public totalFilterLifetime: number = 0;
	@ipsoKey("5902")
	public filterRuntime: number = 0;
	@ipsoKey("5910")
	public filterRemainingLifetime: number = 0;

	@ipsoKey("5903")
	public filterStatus: number = 0;

	@ipsoKey("5906")
	@serializeWith(serializers.booleanInverted, { neverSkip: true })
	@deserializeWith(deserializers.booleanInverted, { neverSkip: true })
	public statusLEDs: boolean = false;

	@ipsoKey("5909")
	public totalMotorRuntime: number = 0;

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
			throw new Error(
				"Cannot use the simplified API on devices which aren't linked to a client instance."
			);
		}
		if (!(this._accessory instanceof Accessory)) {
			throw new Error(
				"Cannot use the simplified API on air purifiers which aren't linked to an Accessory instance."
			);
		}
	}

	/** Changes the fan mode of this air purifier */
	public setFanMode(fanMode: FanMode): Promise<boolean> {
		return this.operateAirPurifier({ fanMode });
	}

	/** Changes the fan speed of this air purifier */
	public setFanSpeed(fanSpeed: number): Promise<boolean> {
		return this.operateAirPurifier({ fanSpeed });
	}

	/** Locks or unlocks the controls on the air purifier */
	public setControlsLocked(locked: boolean): Promise<boolean> {
		return this.operateAirPurifier({ controlsLocked: locked });
	}

	/** Enables or disables the status LEDs */
	public setStatusLEDs(enabled: boolean): Promise<boolean> {
		return this.operateAirPurifier({ statusLEDs: enabled });
	}

	private operateAirPurifier(
		operation: AirPurifierOperation
	): Promise<boolean> {
		this.ensureLink();
		return this.client!.operateAirPurifier(this._accessory!, operation);
	}

	/** Turns this object into JSON while leaving out the potential circular reference */
	public toJSON(): {} {
		return {
			airQuality: this.airQuality,
			controlsLocked: this.controlsLocked,
			statusLEDs: this.statusLEDs,
			fanMode: this.fanMode,
			fanSpeed: this.fanSpeed,
			totalFilterLifetime: this.totalFilterLifetime,
			filterRuntime: this.filterRuntime,
			filterRemainingLifetime: this.filterRemainingLifetime,
			filterStatus: this.filterStatus,
			totalMotorRuntime: this.totalMotorRuntime,
		};
	}
}
