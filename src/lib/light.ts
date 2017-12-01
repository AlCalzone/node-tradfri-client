import { Accessory } from "./accessory";
import { conversions, deserializers, serializers } from "./conversions";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, doNotSerialize, ipsoKey, PropertyTransform, required, serializeWith } from "./ipsoObject";
import { clamp } from "./math";
import { MAX_COLOR, predefinedColors, whiteSpectrumHex } from "./predefined-colors";

// see https://github.com/hreichert/smarthome/blob/master/extensions/binding/org.eclipse.smarthome.binding.tradfri/src/main/java/org/eclipse/smarthome/binding/modules/internal/TradfriColor.java
// for some color conversion

export type LightOperation = Partial<Pick<Light,
	"onOff" | "dimmer" |
	"color" | "colorTemperature" | "colorX" | "colorY" | "hue" | "saturation" |
	"transitionTime"
>>;

export class Light extends IPSODevice {

	constructor(accessory?: Accessory) {
		super();

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
	@doNotSerialize // this is done through colorX / colorY
	public color: string = "f1e0b5"; // hex string

	@ipsoKey("5707")
	@serializeWith(serializers.hue)
	@deserializeWith(deserializers.hue)
	public hue: number; // 0-360
	@ipsoKey("5708")
	@serializeWith(serializers.saturation)
	@deserializeWith(deserializers.saturation)
	public saturation: number; // 0-100%

	@ipsoKey("5709")
	public colorX: number; // int

	@ipsoKey("5710")
	@required((me: Light, ref: Light) => ref != null && me.colorX !== ref.colorX) // force colorY to be present if colorX is
	public colorY: number; // int

	// currently not used directly, since the gateway only accepts 3 distinct values
	// we have to set colorX to set more than those 3 color temps
	@ipsoKey("5711")
	public colorTemperature: number; // TODO: CoAP range unknown!

	@ipsoKey("5712")
	@required()
	@serializeWith(serializers.transitionTime)
	@deserializeWith(deserializers.transitionTime)
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
		const ret = super.clone() as this;
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
			this._spectrum = "none";
			if (this._modelName != null) {
				if (this._modelName.indexOf(" WS ") > -1) {
					// WS = white spectrum
					this._spectrum = "white";
				} else if (this._modelName.indexOf(" C/WS ") > -1 || this._modelName.indexOf(" CWS ") > -1) {
					// CWS = color + white spectrum
					this._spectrum = "rgb";
				}
			}
		}
		return this._spectrum;
	}

	/**
	 * Creates a proxy which redirects the properties to the correct internal one
	 */
	public createProxy(): this {
		switch (this.spectrum) {
			case "white": {
				const proxy = createWhiteSpectrumProxy();
				return super.createProxy(proxy.get, proxy.set);
			}
			case "rgb": {
				const proxy = createRGBProxy();
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
	public async turnOn(): Promise<boolean> {
		this.ensureLink();
		return this.client.operateLight(this._accessory, {
			onOff: true,
		});
	}

	/** Turn this lightbulb off */
	public async turnOff(): Promise<boolean> {
		this.ensureLink();
		return this.client.operateLight(this._accessory, {
			onOff: false,
		});
	}

	/** Toggles this lightbulb on or off */
	public async toggle(value: boolean = !this.onOff): Promise<boolean> {
		this.ensureLink();
		return this.client.operateLight(this._accessory, {
			onOff: value,
		});
	}

	private async operateLight(operation: LightOperation, transitionTime?: number): Promise<boolean> {
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
	public async setBrightness(value: number, transitionTime?: number): Promise<boolean> {
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
	public async setColor(value: string, transitionTime?: number): Promise<boolean> {
		switch (this.spectrum) {
			case "rgb": {
				this.ensureLink();
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
				this.ensureLink();
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
	public async setColorTemperature(value: number, transitionTime?: number): Promise<boolean> {
		if (this.spectrum !== "white") throw new Error("setColorTemperature is only available for white spectrum lightbulbs");
		this.ensureLink();

		value = clamp(value, 0, 100);
		return this.operateLight({
			colorTemperature: value,
		}, transitionTime);
	}

	/**
	 * Changes this lightbulb's color hue
	 * @returns true if a request was sent, false otherwise
	 */
	public async setHue(value: number, transitionTime?: number): Promise<boolean> {
		if (this.spectrum !== "rgb") throw new Error("setHue is only available for RGB lightbulbs");
		this.ensureLink();

		value = clamp(value, 0, 360);
		return this.operateLight({
			hue: value,
		}, transitionTime);
	}

	/**
	 * Changes this lightbulb's color saturation
	 * @returns true if a request was sent, false otherwise
	 */
	public async setSaturation(value: number, transitionTime?: number): Promise<boolean> {
		if (this.spectrum !== "rgb") throw new Error("setSaturation is only available for RGB lightbulbs");
		this.ensureLink();

		value = clamp(value, 0, 100);
		return this.operateLight({
			saturation: value,
		}, transitionTime);
	}
}

export type Spectrum = "none" | "white" | "rgb";

/**
 * Creates a proxy for a white spectrum lamp,
 * which converts color temperature to the correct colorX value
 */
function createWhiteSpectrumProxy<T extends Light>() {
	return {
		get: (me: T, key: PropertyKey) => {
			switch (key) {
				case "colorTemperature": {
					return conversions.whiteSpectrumFromColorX(me.colorX);
				}
				default: return me[key];
			}
		},
		set: (me: T, key: PropertyKey, value) => {
			switch (key) {
				case "colorTemperature": {
					me.colorX = conversions.whiteSpectrumToColorX(value);
					me.colorY = 27000; // magic number, but it works!
					break;
				}
				case "hue":
				case "saturation":
				case "color": {
					// don't update these properties, they are not supported in white spectrum lamps
					break;
				}
				default: me[key] = value;
			}
			return true;
		},
	};
}

const rgbRegex = /^[0-9A-Fa-f]{6}$/;

/**
 * Creates a proxy for an RGB lamp,
 * which converts RGB color to CIE xy
 */
function createRGBProxy<T extends Light>() {
	function get(me: T, key: PropertyKey) {
		switch (key) {
			case "color": {
				if (typeof me.color === "string" && rgbRegex.test(me.color)) {
					// predefined color, return it
					return me.color;
				} else {
					// calculate it from colorX/Y
					const {r, g, b} = conversions.rgbFromCIExyY(me.colorX / MAX_COLOR, me.colorY / MAX_COLOR);
					return conversions.rgbToString(r, g, b);
				}
			}
			case "hue": {
				const {r, g, b} = conversions.rgbFromString(get(me, "color"));
				const {h} = conversions.rgbToHSV(r, g, b);
				return h;
			}
			case "saturation": {
				const {r, g, b} = conversions.rgbFromString(get(me, "color"));
				const {s} = conversions.rgbToHSV(r, g, b);
				return Math.round(s * 100);
			}
			default: return me[key];
		}
	}
	function set(me: T, key: PropertyKey, value, receiver) {
		switch (key) {
			case "color": {
				if (predefinedColors.has(value)) {
					// its a predefined color, use the predefined values
					const definition = predefinedColors.get(value);
					me.colorX = definition.colorX;
					me.colorY = definition.colorY;
				} else {
					// only accept HEX colors
					if (rgbRegex.test(value)) {
						// calculate the X/Y values
						const {r, g, b} = conversions.rgbFromString(value);
						const {x, y} = conversions.rgbToCIExyY(r, g, b);
						me.colorX = Math.round(x * MAX_COLOR);
						me.colorY = Math.round(y * MAX_COLOR);
					}
				}
				break;
			}
			case "hue": {
				let {r, g, b} = conversions.rgbFromString(get(me, "color"));
				// tslint:disable-next-line:prefer-const
				let {h, s, v} = conversions.rgbToHSV(r, g, b);
				h = value;
				({r, g, b} = conversions.rgbFromHSV(h, s, v));
				set(me, "color", conversions.rgbToString(r, g, b), receiver);
				break;
			}
			case "saturation": {
				let {r, g, b} = conversions.rgbFromString(get(me, "color"));
				// tslint:disable-next-line:prefer-const
				let {h, s, v} = conversions.rgbToHSV(r, g, b);
				s = value / 100;
				({r, g, b} = conversions.rgbFromHSV(h, s, v));
				set(me, "color", conversions.rgbToString(r, g, b), receiver);
				break;
			}
			default: me[key] = value;
		}
		return true;
	}

	return {get, set};
}
