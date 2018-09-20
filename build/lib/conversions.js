"use strict";
// tslint:disable:variable-name
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("alcalzone-shared/math");
const strings_1 = require("alcalzone-shared/strings");
const predefined_colors_1 = require("./predefined-colors");
// ==========================
// WHITE SPECTRUM conversions
// interpolate from [0..100%] to [250..454]
const colorTemperature_out = (value) => {
    const [min, max] = predefined_colors_1.colorTemperatureRange;
    // extrapolate 0-100% to [min..max]
    value = math_1.clamp(value, 0, 100);
    return math_1.roundTo(min + value / 100 * (max - min), 0);
};
// interpolate from [250..454] to [0..100%]
const colorTemperature_in = (value) => {
    const [min, max] = predefined_colors_1.colorTemperatureRange;
    // interpolate "color percentage" from the colorTemperature range of a lightbulb
    value = (value - min) / (max - min);
    value = math_1.clamp(value, 0, 1);
    return math_1.roundTo(value * 100, 1);
};
// // ==========================
// // RGB conversions
// // Tradfri lights seem to be Philips Hue Gamut B, see
// // https://developers.meethue.com/documentation/core-concepts#color_gets_more_complicated
// // Conversion based on
// // https://github.com/Q42/Q42.HueApi/blob/master/src/Q42.HueApi.ColorConverters/OriginalWithModel/HueColorConverter.cs
// function rgbToCIExyY(r: number, g: number, b: number) {
// 	// transform [0..255] => [0..1]
// 	[r, g, b] = [r, g, b].map(c => c / 255);
// 	// gamma correction
// 	[r, g, b] = [r, g, b].map(c => (c > 0.04045) ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92);
// 	// transform using custom RGB->XYZ matrix. See comment in Q42
// 	const X = r * 0.664511 + g * 0.154324 + b * 0.162028;
// 	const Y = r * 0.283881 + g * 0.668433 + b * 0.047685;
// 	const Z = r * 0.000088 + g * 0.072310 + b * 0.986039;
// 	let [x, y] = [0, 0];
// 	if (X + Y + Z > 0) {
// 		// calculate CIE xy
// 		x = X / (X + Y + Z);
// 		y = Y / (X + Y + Z);
// 	}
// 	({x, y} = mapToGamut(x, y, DEFAULT_GAMUT));
// 	return {x, y, Y};
// }
// function rgbFromCIExyY(x: number, y: number, Y: number = 1) {
// 	// Map the given point to lie inside the bulb gamut
// 	({x, y} = mapToGamut(x, y, DEFAULT_GAMUT));
// 	// calculate X/Y/Z
// 	const z = 1 - x - y;
// 	const X = (Y / y) * x;
// 	const Z = (Y / y) * z;
// 	// convert to RGB
// 	let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
// 	let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
// 	let b = X * 0.051713 - Y * 0.121364 + Z * 1.011530;
// 	// downscale so the maximum component is not > 1
// 	const maxRGB = Math.max(r, g, b);
// 	if (maxRGB > 1) {
// 		[r, g, b] = [r, g, b].map(c => c / maxRGB);
// 	}
// 	// reverse gamma correction
// 	[r, g, b] = [r, g, b].map(c => c <= 0.0031308 ? 12.92 * c : (1.0 + 0.055) * c ** (1.0 / 2.4) - 0.055);
// 	// transform back to [0..255]
// 	[r, g, b] = [r, g, b].map(c => Math.round(clamp(c, 0, 1) * 255));
// 	return {r, g, b};
// }
// /**
//  * Describes the RGB triangle supported by a lightbulb
//  * in x-y coordinates
//  */
// interface Gamut {
// 	red: Point;
// 	green: Point;
// 	blue: Point;
// }
// const DEFAULT_GAMUT: Gamut = {
// 	red:   {x: 0.700607, y: 0.299301},
// 	green: {x: 0.172416, y: 0.746797},
// 	blue:  {x: 0.135503, y: 0.039879},
// };
// function mapToGamut(x: number, y: number, gamut: Gamut): Point {
// 	const point = {x, y};
// 	const gamutAsTriangle: Triangle = [gamut.red, gamut.green, gamut.blue];
// 	if (!pointInTriangle(gamutAsTriangle, point)) {
// 		const closestEdge = findClosestTriangleEdge(point, gamutAsTriangle);
// 		const projected = projectPointOnEdge(point, closestEdge);
// 		return projected;
// 	} else {
// 		return {x, y};
// 	}
// }
function rgbToHSV(r, g, b) {
    // transform [0..255] => [0..1]
    [r, g, b] = [r, g, b].map(c => c / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h;
    let s;
    const v = math_1.roundTo(max, 2);
    if (r === g && g === b) {
        h = 0;
    }
    else if (max === r) {
        h = 60 * (0 + (g - b) / (max - min));
    }
    else if (max === g) {
        h = 60 * (2 + (b - r) / (max - min));
    }
    else if (max === b) {
        h = 60 * (4 + (r - g) / (max - min));
    }
    h = Math.round(h); // h is defined, we checked all possibilities
    if (h < 0)
        h += 360;
    if (max === 0) {
        s = 0;
    }
    else {
        s = math_1.roundTo((max - min) / max, 3);
    }
    return { h, s, v };
}
function rgbFromHSV(h, s, v) {
    let r;
    let g;
    let b;
    if (s === 0) {
        r = g = b = v;
    }
    else {
        const hi = Math.floor(h / 60);
        const f = (h / 60 - hi);
        const p = v * (1 - s);
        const q = v * (1 - s * f);
        const t = v * (1 - s * (1 - f));
        switch (hi) {
            case 0:
            case 6:
                [r, g, b] = [v, t, p];
                break;
            case 1:
                [r, g, b] = [q, v, p];
                break;
            case 2:
                [r, g, b] = [p, v, t];
                break;
            case 3:
                [r, g, b] = [p, q, v];
                break;
            case 4:
                [r, g, b] = [t, p, v];
                break;
            case 5:
                [r, g, b] = [v, p, q];
                break;
        }
    }
    // transform back to [0..255] - r, g and b are defined always
    [r, g, b] = [r, g, b].map(c => Math.round(math_1.clamp(c, 0, 1) * 255));
    return { r, g, b };
}
function rgbToString(r, g, b) {
    return [r, g, b].map(c => strings_1.padStart(c.toString(16), 2, "0")).join("");
}
function rgbFromString(rgb) {
    const r = parseInt(rgb.substr(0, 2), 16);
    const g = parseInt(rgb.substr(2, 2), 16);
    const b = parseInt(rgb.substr(4, 2), 16);
    return { r, g, b };
}
// ===========================
// RGB serializers
// interpolate hue from [0..360] to [0..COLOR_MAX]
const hue_out = (value, light) => {
    if (light != null && light.spectrum !== "rgb")
        return null; // hue is not supported
    value = math_1.clamp(value, 0, 360);
    return math_1.roundTo(value / 360 * predefined_colors_1.MAX_COLOR, 0);
};
// interpolate hue from [0..COLOR_MAX] to [0..360]
const hue_in = (value /*, light: Light*/) => {
    value = math_1.clamp(value / predefined_colors_1.MAX_COLOR, 0, 1);
    return math_1.roundTo(value * 360, 1);
};
// interpolate saturation from [0..100%] to [0..COLOR_MAX]
const saturation_out = (value, light) => {
    if (light != null && light.spectrum !== "rgb")
        return null; // hue is not supported
    value = math_1.clamp(value, 0, 100);
    return math_1.roundTo(value / 100 * predefined_colors_1.MAX_COLOR, 0);
};
// interpolate saturation from [0..COLOR_MAX] to [0..100%]
const saturation_in = (value /*, light: Light*/) => {
    value = math_1.clamp(value / predefined_colors_1.MAX_COLOR, 0, 1);
    return math_1.roundTo(value * 100, 1);
};
// ===========================
// TRANSITION TIME conversions
// the sent value is in 10ths of seconds, we're working with seconds
const transitionTime_out = val => val && val * 10; // "val && " avoids sending `null` if val is null for some reason
// the sent value is in 10ths of seconds, we're working with seconds
const transitionTime_in = val => val / 10;
// ===========================
// BRIGHTNESS conversions
// interpolate from [0..100%] to [0..254]
const brightness_out = (value) => {
    value = math_1.clamp(value, 0, 100);
    return math_1.roundTo(value / 100 * 254, 0);
};
// interpolate from [0..254] to [0..100%]
const brightness_in = (value) => {
    value = math_1.clamp(value, 0, 254);
    if (value === 0)
        return 0;
    value = value / 254 * 100;
    return math_1.roundTo(value, 1);
};
exports.serializers = {
    transitionTime: transitionTime_out,
    hue: hue_out,
    saturation: saturation_out,
    brightness: brightness_out,
    colorTemperature: colorTemperature_out,
};
exports.deserializers = {
    transitionTime: transitionTime_in,
    hue: hue_in,
    saturation: saturation_in,
    brightness: brightness_in,
    colorTemperature: colorTemperature_in,
};
exports.conversions = {
    // rgbFromCIExyY,
    // rgbToCIExyY,
    rgbFromHSV,
    rgbToHSV,
    rgbToString,
    rgbFromString,
};
