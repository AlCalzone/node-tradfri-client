"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const accessory_1 = require("./accessory");
const conversions_1 = require("./conversions");
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
const math_1 = require("./math");
const predefined_colors_1 = require("./predefined-colors");
class Light extends ipsoDevice_1.IPSODevice {
    constructor(accessory, options) {
        super(options);
        this.color = "f1e0b5"; // hex string
        this.transitionTime = 0.5; // <float>
        /**
         * Returns the supported color spectrum of the lightbulb
         */
        this._spectrum = null;
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
            accessory.deviceInfo.modelNumber.length > 0) {
            this._modelName = accessory.deviceInfo.modelNumber;
        }
    }
    /**
     * Returns true if the current lightbulb is dimmable
     */
    get isDimmable() {
        return true; // we know no lightbulbs that aren't dimmable
    }
    /**
     * Returns true if the current lightbulb is switchable
     */
    get isSwitchable() {
        return true; // we know no lightbulbs that aren't switchable
    }
    clone() {
        const ret = super.clone();
        ret._modelName = this._modelName;
        return ret;
    }
    get spectrum() {
        if (this._spectrum == null) {
            // determine the spectrum
            this._spectrum = "none";
            if (this._modelName != null) {
                if (this._modelName.indexOf(" WS ") > -1) {
                    // WS = white spectrum
                    this._spectrum = "white";
                }
                else if (this._modelName.indexOf(" C/WS ") > -1 || this._modelName.indexOf(" CWS ") > -1) {
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
    createProxy() {
        switch (this.spectrum) {
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
    ensureLink() {
        if (this.client == null) {
            throw new Error("Cannot use the simplified API on devices which aren't linked to a client instance.");
        }
        if (!(this._accessory instanceof accessory_1.Accessory)) {
            throw new Error("Cannot use the simplified API on lightbulbs which aren't linked to an Accessory instance.");
        }
    }
    /** Turn this lightbulb on */
    turnOn() {
        return __awaiter(this, void 0, void 0, function* () {
            this.ensureLink();
            return this.client.operateLight(this._accessory, {
                onOff: true,
            });
        });
    }
    /** Turn this lightbulb off */
    turnOff() {
        return __awaiter(this, void 0, void 0, function* () {
            this.ensureLink();
            return this.client.operateLight(this._accessory, {
                onOff: false,
            });
        });
    }
    /** Toggles this lightbulb on or off */
    toggle(value = !this.onOff) {
        return __awaiter(this, void 0, void 0, function* () {
            this.ensureLink();
            return this.client.operateLight(this._accessory, {
                onOff: value,
            });
        });
    }
    operateLight(operation, transitionTime) {
        return __awaiter(this, void 0, void 0, function* () {
            if (transitionTime != null) {
                transitionTime = Math.max(0, transitionTime);
                operation.transitionTime = transitionTime;
            }
            return this.client.operateLight(this._accessory, operation);
        });
    }
    /**
     * Changes this lightbulb's brightness
     * @returns true if a request was sent, false otherwise
     */
    setBrightness(value, transitionTime) {
        return __awaiter(this, void 0, void 0, function* () {
            this.ensureLink();
            value = math_1.clamp(value, 0, 100);
            return this.operateLight({
                dimmer: value,
            }, transitionTime);
        });
    }
    /**
     * Changes this lightbulb's color
     * @param value The target color as a 6-digit hex string
     * @returns true if a request was sent, false otherwise
     */
    setColor(value, transitionTime) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (this.spectrum) {
                case "rgb": {
                    this.ensureLink();
                    return this.operateLight({
                        color: value,
                    }, transitionTime);
                }
                case "white": {
                    // We make an exception for the predefined white spectrum colors
                    if (!(value in predefined_colors_1.whiteSpectrumHex)) {
                        throw new Error("White spectrum bulbs only support the following colors: " +
                            Object.keys(predefined_colors_1.whiteSpectrumHex).join(", "));
                    }
                    this.ensureLink();
                    return this.operateLight({
                        colorTemperature: predefined_colors_1.whiteSpectrumHex[value],
                    }, transitionTime);
                }
                default: {
                    throw new Error("setColor is only available for RGB lightbulbs");
                }
            }
        });
    }
    /**
     * Changes this lightbulb's color temperature
     * @param value The target color temperature in the range 0% (cold) to 100% (warm)
     * @returns true if a request was sent, false otherwise
     */
    setColorTemperature(value, transitionTime) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.spectrum !== "white")
                throw new Error("setColorTemperature is only available for white spectrum lightbulbs");
            this.ensureLink();
            value = math_1.clamp(value, 0, 100);
            return this.operateLight({
                colorTemperature: value,
            }, transitionTime);
        });
    }
    /**
     * Changes this lightbulb's color hue
     * @returns true if a request was sent, false otherwise
     */
    setHue(value, transitionTime) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.spectrum !== "rgb")
                throw new Error("setHue is only available for RGB lightbulbs");
            this.ensureLink();
            value = math_1.clamp(value, 0, 360);
            return this.operateLight({
                hue: value,
            }, transitionTime);
        });
    }
    /**
     * Changes this lightbulb's color saturation
     * @returns true if a request was sent, false otherwise
     */
    setSaturation(value, transitionTime) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.spectrum !== "rgb")
                throw new Error("setSaturation is only available for RGB lightbulbs");
            this.ensureLink();
            value = math_1.clamp(value, 0, 100);
            return this.operateLight({
                saturation: value,
            }, transitionTime);
        });
    }
}
__decorate([
    ipsoObject_1.doNotSerialize,
    __metadata("design:type", String)
], Light.prototype, "_modelName", void 0);
__decorate([
    ipsoObject_1.doNotSerialize,
    __metadata("design:type", accessory_1.Accessory)
], Light.prototype, "_accessory", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5706"),
    ipsoObject_1.doNotSerialize // this is done through colorX / colorY
    ,
    __metadata("design:type", String)
], Light.prototype, "color", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5707"),
    ipsoObject_1.serializeWith(conversions_1.serializers.hue),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.hue),
    __metadata("design:type", Number)
], Light.prototype, "hue", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5708"),
    ipsoObject_1.serializeWith(conversions_1.serializers.saturation),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.saturation),
    __metadata("design:type", Number)
], Light.prototype, "saturation", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5709"),
    __metadata("design:type", Number)
], Light.prototype, "colorX", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5710"),
    ipsoObject_1.required((me, ref) => ref != null && me.colorX !== ref.colorX) // force colorY to be present if colorX is
    ,
    __metadata("design:type", Number)
], Light.prototype, "colorY", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5711"),
    ipsoObject_1.serializeWith(conversions_1.serializers.colorTemperature),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.colorTemperature),
    __metadata("design:type", Number)
], Light.prototype, "colorTemperature", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5717"),
    __metadata("design:type", Object)
], Light.prototype, "UNKNOWN1", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5712"),
    ipsoObject_1.required(),
    ipsoObject_1.serializeWith(conversions_1.serializers.transitionTime, { neverSkip: true }),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.transitionTime, { neverSkip: true }),
    __metadata("design:type", Number)
], Light.prototype, "transitionTime", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5805"),
    __metadata("design:type", Number)
], Light.prototype, "cumulativeActivePower", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5851"),
    ipsoObject_1.serializeWith(conversions_1.serializers.brightness),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.brightness),
    __metadata("design:type", Number)
], Light.prototype, "dimmer", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5850"),
    __metadata("design:type", Boolean)
], Light.prototype, "onOff", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5852"),
    __metadata("design:type", Number)
], Light.prototype, "onTime", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5820"),
    __metadata("design:type", Number)
], Light.prototype, "powerFactor", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5701"),
    __metadata("design:type", String)
], Light.prototype, "unit", void 0);
exports.Light = Light;
const rgbRegex = /^[0-9A-Fa-f]{6}$/;
/**
 * Creates a proxy for an RGB lamp,
 * which converts RGB color to CIE xy
 */
function createRGBProxy() {
    function get(me, key) {
        switch (key) {
            case "color": {
                if (typeof me.color === "string" && rgbRegex.test(me.color)) {
                    // predefined color, return it
                    return me.color;
                }
                else {
                    // calculate it from colorX/Y
                    const { r, g, b } = conversions_1.conversions.rgbFromCIExyY(me.colorX / predefined_colors_1.MAX_COLOR, me.colorY / predefined_colors_1.MAX_COLOR);
                    return conversions_1.conversions.rgbToString(r, g, b);
                }
            }
            case "hue": {
                const { r, g, b } = conversions_1.conversions.rgbFromString(get(me, "color"));
                const { h } = conversions_1.conversions.rgbToHSV(r, g, b);
                return h;
            }
            case "saturation": {
                const { r, g, b } = conversions_1.conversions.rgbFromString(get(me, "color"));
                const { s } = conversions_1.conversions.rgbToHSV(r, g, b);
                return Math.round(s * 100);
            }
            default: return me[key];
        }
    }
    function set(me, key, value, receiver) {
        switch (key) {
            case "color": {
                if (predefined_colors_1.predefinedColors.has(value)) {
                    // its a predefined color, use the predefined values
                    const definition = predefined_colors_1.predefinedColors.get(value);
                    me.colorX = definition.colorX;
                    me.colorY = definition.colorY;
                }
                else {
                    // only accept HEX colors
                    if (rgbRegex.test(value)) {
                        // calculate the X/Y values
                        const { r, g, b } = conversions_1.conversions.rgbFromString(value);
                        const { x, y } = conversions_1.conversions.rgbToCIExyY(r, g, b);
                        me.colorX = Math.round(x * predefined_colors_1.MAX_COLOR);
                        me.colorY = Math.round(y * predefined_colors_1.MAX_COLOR);
                    }
                }
                break;
            }
            case "hue": {
                let { r, g, b } = conversions_1.conversions.rgbFromString(get(me, "color"));
                // tslint:disable-next-line:prefer-const
                let { h, s, v } = conversions_1.conversions.rgbToHSV(r, g, b);
                h = value;
                ({ r, g, b } = conversions_1.conversions.rgbFromHSV(h, s, v));
                set(me, "color", conversions_1.conversions.rgbToString(r, g, b), receiver);
                break;
            }
            case "saturation": {
                let { r, g, b } = conversions_1.conversions.rgbFromString(get(me, "color"));
                // tslint:disable-next-line:prefer-const
                let { h, s, v } = conversions_1.conversions.rgbToHSV(r, g, b);
                s = value / 100;
                ({ r, g, b } = conversions_1.conversions.rgbFromHSV(h, s, v));
                set(me, "color", conversions_1.conversions.rgbToString(r, g, b), receiver);
                break;
            }
            default: me[key] = value;
        }
        return true;
    }
    return { get, set };
}
