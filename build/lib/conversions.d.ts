import { PropertyTransform } from "./ipsoObject";
export declare const serializers: {
    transitionTime: PropertyTransform;
    hue: PropertyTransform;
    saturation: PropertyTransform;
    brightness: PropertyTransform;
};
export declare const deserializers: {
    transitionTime: PropertyTransform;
    hue: PropertyTransform;
    saturation: PropertyTransform;
    brightness: PropertyTransform;
};
export declare const conversions: {
    whiteSpectrumToColorX: PropertyTransform;
    whiteSpectrumFromColorX: PropertyTransform;
    rgbFromCIExyY: (x: number, y: number, Y?: number) => {
        r: number;
        g: number;
        b: number;
    };
    rgbToCIExyY: (r: number, g: number, b: number) => {
        x: number;
        y: number;
        Y: number;
    };
    rgbFromHSV: (h: number, s: number, v: number) => {
        r: number;
        g: number;
        b: number;
    };
    rgbToHSV: (r: number, g: number, b: number) => {
        h: number;
        s: number;
        v: number;
    };
    rgbToString: (r: number, g: number, b: number) => string;
    rgbFromString: (rgb: string) => {
        r: number;
        g: number;
        b: number;
    };
};
