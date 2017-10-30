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
Object.defineProperty(exports, "__esModule", { value: true });
const conversions_1 = require("./conversions");
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
const predefined_colors_1 = require("./predefined-colors");
class Light extends ipsoDevice_1.IPSODevice {
    constructor(accessory) {
        super();
        this.color = "f1e0b5"; // hex string
        this.transitionTime = 0.5; // <float>
        /**
         * Returns the supported color spectrum of the lightbulb
         */
        this._spectrum = null;
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
    isDimmable() {
        return true; // we know no lightbulbs that aren't dimmable
    }
    /**
     * Returns true if the current lightbulb is switchable
     */
    isSwitchable() {
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
    __metadata("design:type", Number)
], Light.prototype, "colorY", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5711"),
    __metadata("design:type", Number)
], Light.prototype, "colorTemperature", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5712"),
    ipsoObject_1.required,
    ipsoObject_1.serializeWith(conversions_1.serializers.transitionTime),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.transitionTime),
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
/**
 * Creates a proxy for a white spectrum lamp,
 * which converts color temperature to the correct colorX value
 */
function createWhiteSpectrumProxy() {
    return {
        get: (me, key) => {
            switch (key) {
                case "colorTemperature": {
                    return conversions_1.conversions.whiteSpectrumFromColorX(me.colorX);
                }
                default: return me[key];
            }
        },
        set: (me, key, value) => {
            switch (key) {
                case "colorTemperature": {
                    me.colorX = conversions_1.conversions.whiteSpectrumToColorX(value);
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
