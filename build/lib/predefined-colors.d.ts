export interface ColorDefinition {
    /** X coordinate in the CIE color space */
    colorX: number;
    /** Y coordinate in the CIE color space */
    colorY: number;
    hue: number;
    saturation: number;
    /** Color temperature in Mired (if defined) */
    temperature?: number;
    /** RGB hex color */
    rgbHex: string;
}
/**
 * The maximum value of color related numbers in Tradfri
 */
export declare const MAX_COLOR: number;
/**
 * All predefined RGB colors in the app
 */
export declare const predefinedColors: Map<string, ColorDefinition>;
/**
 * The hex colors for the white spectrum, sorted from cold to warm
 */
export declare const whiteSpectrumHex: string[];
/**
 * The color temp in Mired for the white spectrum, sorted from cold to warm
 */
export declare const whiteSpectrumTemp: number[];
export declare const whiteSpectrumRange: number[];
