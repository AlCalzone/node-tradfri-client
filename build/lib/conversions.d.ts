import { PropertyTransformKernel } from "./ipsoObject";
declare function rgbToHSV(r: number, g: number, b: number): {
    h: number;
    s: number;
    v: number;
};
declare function rgbFromHSV(h: number, s: number, v: number): {
    r: number;
    g: number;
    b: number;
};
declare function rgbToString(r: number, g: number, b: number): string;
declare function rgbFromString(rgb: string): {
    r: number;
    g: number;
    b: number;
};
export declare const serializers: {
    transitionTime: PropertyTransformKernel;
    hue: PropertyTransformKernel;
    saturation: PropertyTransformKernel;
    brightness: PropertyTransformKernel;
    colorTemperature: PropertyTransformKernel;
    position: PropertyTransformKernel;
};
export declare const deserializers: {
    transitionTime: PropertyTransformKernel;
    hue: PropertyTransformKernel;
    saturation: PropertyTransformKernel;
    brightness: PropertyTransformKernel;
    colorTemperature: PropertyTransformKernel;
    position: PropertyTransformKernel;
};
export declare const conversions: {
    rgbFromHSV: typeof rgbFromHSV;
    rgbToHSV: typeof rgbToHSV;
    rgbToString: typeof rgbToString;
    rgbFromString: typeof rgbFromString;
};
export {};
