import { Accessory } from "./accessory";
import { conversions, deserializers, serializers } from "./conversions";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, doNotSerialize, ipsoKey, IPSOObject, PropertyTransform, required, serializeWith } from "./ipsoObject";
import { MAX_COLOR, predefinedColors } from "./predefined-colors";

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

		// get the model number to detect features
		if (accessory != null &&
			accessory.deviceInfo != null &&
			accessory.deviceInfo.modelNumber != null &&
			accessory.deviceInfo.modelNumber.length > 0
		) {
			this._modelName = accessory.deviceInfo.modelNumber;
		}
	}

	private _modelName: string;

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
	public isDimmable(): boolean {
		return true; // we know no lightbulbs that aren't dimmable
	}

	/**
	 * Returns true if the current lightbulb is switchable
	 */
	public isSwitchable(): boolean {
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
