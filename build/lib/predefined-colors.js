"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The maximum value of color related numbers in Tradfri
 */
exports.MAX_COLOR = 65279;
/**
 * All predefined RGB colors in the app
 */
exports.predefinedColors = new Map();
/**
 * The hex colors for the white spectrum and the corresponding colorTemperature values, sorted from cold to warm
 */
exports.whiteSpectrumHex = {
    f5faf6: 0,
    f1e0b5: 63,
    efd275: 100,
};
function defineColor(rgbHex, x, y, hue, saturation, temperature) {
    const definition = {
        colorX: Math.round(x * exports.MAX_COLOR),
        colorY: Math.round(y * exports.MAX_COLOR),
        hue: hue * 360 / exports.MAX_COLOR,
        hue_raw: hue,
        saturation: saturation * 100 / exports.MAX_COLOR,
        saturation_raw: saturation,
        rgbHex,
    };
    if (temperature != null)
        definition.temperature = temperature;
    exports.predefinedColors.set(rgbHex, definition);
}
// taken from the Tradfri app
defineColor("dcf0f8", 0.3221, 0.3317, 2681, 4360);
defineColor("eaf6fb", 0.3451, 0.3451, 5989, 12964);
defineColor("f5faf6", 0.3804, 0.3804, 5800, 24394, 250);
defineColor("f2eccf", 0.4369, 0.4041, 5129, 40781);
defineColor("f1e0b5", 0.4599, 0.4106, 5427, 42596, 370);
defineColor("efd275", 0.5056, 0.4152, 5309, 52400, 454);
defineColor("ebb63e", 0.5516, 0.4075, 4980, 62974);
defineColor("e78834", 0.58, 0.38, 4137, 65279);
defineColor("e57345", 0.58, 0.35, 1662, 53420);
defineColor("da5d41", 0.62, 0.34, 1490, 61206);
defineColor("dc4b31", 0.66, 0.32, 0, 65279);
defineColor("e491af", 0.5, 0.28, 62148, 49198);
defineColor("e8bedd", 0.45, 0.28, 62007, 41158);
defineColor("d9337c", 0.5, 0.24, 59789, 65279);
defineColor("c984bb", 0.34, 0.19, 55784, 44554);
defineColor("8f2686", 0.31, 0.12, 53953, 65279);
defineColor("4a418a", 0.17, 0.05, 47822, 65279);
defineColor("6c83ba", 0.2, 0.1, 47324, 51774);
defineColor("a9d62b", 0.41, 0.51, 11383, 65279);
defineColor("d6e44b", 0.45, 0.47, 8572, 55985);
/**
 * The white spectrum [cold, warm] in Mireds, as defined in the app
 */
exports.colorTemperatureRange = [250, 454];
