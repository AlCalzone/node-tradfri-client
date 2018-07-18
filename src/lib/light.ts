import { clamp } from "alcalzone-shared/math";
import { Accessory } from "./accessory";
import { conversions, deserializers, serializers } from "./conversions";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, doNotSerialize, ipsoKey, IPSOOptions, PropertyTransform, required, serializeWith } from "./ipsoObject";
import { MAX_COLOR, predefinedColors, whiteSpectrumHex } from "./predefined-colors";

// see https://github.com/hreichert/smarthome/blob/master/extensions/binding/org.eclipse.smarthome.binding.tradfri/src/main/java/org/eclipse/smarthome/binding/modules/internal/TradfriColor.java
// for some color conversion

export type LightOperation = Partial<Pick<Light,
	"onOff" | "dimmer" |
	"color" | "colorTemperature" | "colorX" | "colorY" | "hue" | "saturation" |
	"transitionTime"
	>>;

export class Light extends IPSODevice {

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

	@doNotSerialize private _modelName: string;
	@doNotSerialize private _accessory: Accessory;

	@ipsoKey("5706")
	@doNotSerialize // this is done through hue/saturation
	public color: string = "f1e0b5"; // hex string

	// As of Gateway version v1.3.14, this is finally supported too
	// They both have to be given in the same payload or the other one is considered = 0
	@ipsoKey("5707")
	@serializeWith(serializers.hue)
	@deserializeWith(deserializers.hue)
	@required((me: Light, ref: Light) => ref != null && me.saturation !== ref.saturation) // force hue to be present if saturation is
	public hue: number; // 0-360
	@ipsoKey("5708")
	@serializeWith(serializers.saturation)
	@deserializeWith(deserializers.saturation)
	@required((me: Light, ref: Light) => ref != null && me.hue !== ref.hue) // force saturation to be present if hue is
	public saturation: number; // 0-100%

	@ipsoKey("5709")
	@doNotSerialize
	public colorX: number; // int

	@ipsoKey("5710")
	@doNotSerialize
	public colorY: number; // int

	// As of Gateway version v1.3.14, this is finally supported
	@ipsoKey("5711")
	@serializeWith(serializers.colorTemperature)
	@deserializeWith(deserializers.colorTemperature)
	public colorTemperature: number;

	// This property was added in Gateway v1.3.14
	// not sure what it does, as it is not in the IKEA app yet
	/** @internal */
	@ipsoKey("5717")
	public UNKNOWN1: any;

	@ipsoKey("5712")
	@required()
	@serializeWith(serializers.transitionTime, { neverSkip: true })
	@deserializeWith(deserializers.transitionTime, { neverSkip: true })
	public transitionTime: number = 0.5; // <float>

	@ipsoKey("5805")
	public cumulativeActivePower: number; // <float>

	@ipsoKey("5851")
	@serializeWith(serializers.brightness)
	@deserializeWith(deserializers.brightness)
	public dimmer: number; // <int> [0..100]

	@ipsoKey("5850")
	public onOff: boolean;

	@ipsoKey("5852")
	public onTime: number; // <int>

	@ipsoKey("5820")
	public powerFactor: number; // <float>

	@ipsoKey("5701")
	public unit: string;

	/**
	 * Returns true if the current lightbulb is dimmable
	 */
	public get isDimmable(): boolean {
		return true; // we know no lightbulbs that aren't dimmable
	}

	/**
	 * Returns true if the current lightbulb is switchable
	 */
	public get isSwitchable(): boolean {
		return true; // we know no lightbulbs that aren't switchable
	}

	public clone(): this {
		const ret = super.clone(this._accessory) as this;
		ret._modelName = this._modelName;
		return ret;
	}

	/**
	 * Returns the supported color spectrum of the lightbulb
	 */
	private _spectrum: Spectrum = null;
	public get spectrum(): Spectrum {
		if (this._spectrum == null) {
			// determine the spectrum
			if (this.hue != null && this.saturation != null) {
				this._spectrum = "rgb";
			} else if (this.colorTemperature != null) {
				this._spectrum = "white";
			} else {
				this._spectrum = "none";
			}
		}
		return this._spectrum;
	}

	/**
	 * Creates a proxy which redirects the properties to the correct internal one
	 */
	public createProxy(): this {
		const raw = this._accessory instanceof Accessory ?
			this._accessory.options.skipValueSerializers :
			false
		;
		switch (this.spectrum) {
			case "rgb": {
				const proxy = createRGBProxy(raw);
				return super.createProxy(proxy.get, proxy.set);
			}
			default:
				return this;
		}
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
			throw new Error("Cannot use the simplified API on lightbulbs which aren't linked to an Accessory instance.");
		}
	}

	/** Turn this lightbulb on */
	public turnOn(): Promise<boolean> {
		this.ensureLink();
		return this.client.operateLight(this._accessory, {
			onOff: true,
		});
	}

	/** Turn this lightbulb off */
	public turnOff(): Promise<boolean> {
		this.ensureLink();
		return this.client.operateLight(this._accessory, {
			onOff: false,
		});
	}

	/** Toggles this lightbulb on or off */
	public toggle(value: boolean = !this.onOff): Promise<boolean> {
		this.ensureLink();
		return this.client.operateLight(this._accessory, {
			onOff: value,
		});
	}

	private operateLight(operation: LightOperation, transitionTime?: number): Promise<boolean> {
		if (transitionTime != null) {
			transitionTime = Math.max(0, transitionTime);
			operation.transitionTime = transitionTime;
		}
		return this.client.operateLight(this._accessory, operation);
	}

	/**
	 * Changes this lightbulb's brightness
	 * @returns true if a request was sent, false otherwise
	 */
	public setBrightness(value: number, transitionTime?: number): Promise<boolean> {
		this.ensureLink();

		value = clamp(value, 0, 100);
		return this.operateLight({
			dimmer: value,
		}, transitionTime);
	}

	/**
	 * Changes this lightbulb's color
	 * @param value The target color as a 6-digit hex string
	 * @returns true if a request was sent, false otherwise
	 */
	public setColor(value: string, transitionTime?: number): Promise<boolean> {
		this.ensureLink();

		switch (this.spectrum) {
			case "rgb": {
				return this.operateLight({
					color: value,
				}, transitionTime);
			}

			case "white": {
				// We make an exception for the predefined white spectrum colors
				if (!(value in whiteSpectrumHex)) {
					throw new Error(
						"White spectrum bulbs only support the following colors: " +
						Object.keys(whiteSpectrumHex).join(", "),
					);
				}
				return this.operateLight({
					colorTemperature: whiteSpectrumHex[value],
				}, transitionTime);
			}
			default: {
				throw new Error("setColor is only available for RGB lightbulbs");
			}
		}
	}

	/**
	 * Changes this lightbulb's color temperature
	 * @param value The target color temperature in the range 0% (cold) to 100% (warm)
	 * @returns true if a request was sent, false otherwise
	 */
	public setColorTemperature(value: number, transitionTime?: number): Promise<boolean> {
		this.ensureLink();
		if (this.spectrum !== "white") throw new Error("setColorTemperature is only available for white spectrum lightbulbs");

		value = clamp(value, 0, 100);
		return this.operateLight({
			colorTemperature: value,
		}, transitionTime);
	}

	/**
	 * Changes this lightbulb's color hue
	 * @returns true if a request was sent, false otherwise
	 */
	public setHue(value: number, transitionTime?: number): Promise<boolean> {
		this.ensureLink();
		if (this.spectrum !== "rgb") throw new Error("setHue is only available for RGB lightbulbs");

		value = clamp(value, 0, 360);
		return this.operateLight({
			hue: value,
		}, transitionTime);
	}

	/**
	 * Changes this lightbulb's color saturation
	 * @returns true if a request was sent, false otherwise
	 */
	public setSaturation(value: number, transitionTime?: number): Promise<boolean> {
		this.ensureLink();
		if (this.spectrum !== "rgb") throw new Error("setSaturation is only available for RGB lightbulbs");

		value = clamp(value, 0, 100);
		return this.operateLight({
			saturation: value,
		}, transitionTime);
	}

	/** Turns this object into JSON while leaving out the potential circular reference */
	public toJSON(): {} {
		return {
			onOff: this.onOff,
			dimmer: this.dimmer,
			color: this.color,
			colorTemperature: this.colorTemperature,
			colorX: this.colorX,
			colorY: this.colorY,
			hue: this.hue,
			saturation: this.saturation,
			transitionTime: this.transitionTime,
		};
	}

	/**
	 * Fixes property values that are known to be bugged
	 */
	public fixBuggedProperties(): this {
		super.fixBuggedProperties();
		// For some reason the gateway reports lights with brightness 1 after turning off
		if (this.onOff === false && this.dimmer === MIN_BRIGHTNESS) this.dimmer = 0;
		return this;
	}
}

// remember the minimum possible non-zero brightness to fix the bugged properties;
const MIN_BRIGHTNESS = deserializers.brightness(1);

export type Spectrum = "none" | "white" | "rgb";

const rgbRegex = /^[0-9A-Fa-f]{6}$/;

/**
 * Creates a proxy for an RGB lamp,
 * which converts RGB color to CIE xy
 */
function createRGBProxy<T extends Light>(raw: boolean = false) {
	function get(me: T, key: PropertyKey) {
		switch (key) {
			case "color": {
				if (typeof me.color === "string" && rgbRegex.test(me.color)) {
					// predefined color, return it
					return me.color;
				} else {
					// calculate it from hue/saturation
					const { r, g, b } = conversions.rgbFromHSV(me.hue, me.saturation / 100, 1);
					return conversions.rgbToString(r, g, b);
				}
			}
			default: return me[key as keyof T];
		}
	}
	function set(me: T, key: PropertyKey, value: any, receiver: any) {
		switch (key) {
			case "color": {
				if (predefinedColors.has(value)) {
					// its a predefined color, use the predefined values
					const definition = predefinedColors.get(value);
					if (raw) {
						me.hue = definition.hue_raw;
						me.saturation = definition.saturation_raw;
					} else {
						me.hue = definition.hue;
						me.saturation = definition.saturation;
					}
				} else {
					// only accept HEX colors
					if (rgbRegex.test(value)) {
						// calculate the X/Y values
						const { r, g, b } = conversions.rgbFromString(value);
						const { h, s, v } = conversions.rgbToHSV(r, g, b);
						if (raw) {
							me.hue = Math.round(h / 360 * MAX_COLOR);
							me.saturation = Math.round(s * MAX_COLOR);
						} else {
							me.hue = h;
							me.saturation = s * 100;
						}
					}
				}
				break;
			}
			default: me[key as keyof T] = value;
		}
		return true;
	}

	return { get, set };
}
