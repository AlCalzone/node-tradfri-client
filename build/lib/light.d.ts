import { Accessory } from "./accessory";
import { IPSODevice } from "./ipsoDevice";
export declare type LightOperation = Partial<Pick<Light, "onOff" | "dimmer" | "color" | "colorTemperature" | "colorX" | "colorY" | "hue" | "saturation" | "transitionTime">>;
export declare class Light extends IPSODevice {
    constructor(accessory?: Accessory);
    private _modelName;
    color: string;
    hue: number;
    saturation: number;
    colorX: number;
    colorY: number;
    colorTemperature: number;
    transitionTime: number;
    cumulativeActivePower: number;
    dimmer: number;
    onOff: boolean;
    onTime: number;
    powerFactor: number;
    unit: string;
    /**
     * Returns true if the current lightbulb is dimmable
     */
    isDimmable(): boolean;
    /**
     * Returns true if the current lightbulb is switchable
     */
    isSwitchable(): boolean;
    clone(): this;
    /**
     * Returns the supported color spectrum of the lightbulb
     */
    private _spectrum;
    readonly spectrum: Spectrum;
    /**
     * Creates a proxy which redirects the properties to the correct internal one
     */
    createProxy(): this;
}
export declare type Spectrum = "none" | "white" | "rgb";
