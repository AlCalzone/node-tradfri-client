import { Accessory } from "./accessory";
import { IPSODevice } from "./ipsoDevice";
import { IPSOOptions } from "./ipsoObject";
export declare type LightOperation = Partial<Pick<Light, "onOff" | "dimmer" | "whenPowerRestored" | "color" | "colorTemperature" | "colorX" | "colorY" | "hue" | "saturation" | "transitionTime">>;
export declare enum PowerRestoredAction {
    TurnOn = 2,
    RememberStatus = 4
}
export declare class Light extends IPSODevice {
    constructor(options?: IPSOOptions, accessory?: Accessory);
    private _modelName;
    private _accessory;
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
    whenPowerRestored: PowerRestoredAction;
    onTime: number;
    powerFactor: number;
    unit: string;
    /**
     * Returns true if the current lightbulb is dimmable
     */
    get isDimmable(): boolean;
    /**
     * Returns true if the current lightbulb is switchable
     */
    get isSwitchable(): boolean;
    clone(): this;
    /**
     * Returns the supported color spectrum of the lightbulb
     */
    private _spectrum;
    get spectrum(): Spectrum;
    /**
     * Creates a proxy which redirects the properties to the correct internal one
     */
    createProxy(): this;
    /**
     * Ensures this instance is linked to a tradfri client and an accessory
     * @throws Throws an error if it isn't
     */
    private ensureLink;
    /** Turn this lightbulb on */
    turnOn(): Promise<boolean>;
    /** Turn this lightbulb off */
    turnOff(): Promise<boolean>;
    /** Toggles this lightbulb on or off */
    toggle(value?: boolean): Promise<boolean>;
    private operateLight;
    /**
     * Changes this lightbulb's brightness
     * @returns true if a request was sent, false otherwise
     */
    setBrightness(value: number, transitionTime?: number): Promise<boolean>;
    /**
     * Changes this lightbulb's color
     * @param value The target color as a 6-digit hex string
     * @returns true if a request was sent, false otherwise
     */
    setColor(value: string, transitionTime?: number): Promise<boolean>;
    /**
     * Changes this lightbulb's color temperature
     * @param value The target color temperature in the range 0% (cold) to 100% (warm)
     * @returns true if a request was sent, false otherwise
     */
    setColorTemperature(value: number, transitionTime?: number): Promise<boolean>;
    /**
     * Changes this lightbulb's color hue
     * @returns true if a request was sent, false otherwise
     */
    setHue(value: number, transitionTime?: number): Promise<boolean>;
    /**
     * Changes this lightbulb's color saturation
     * @returns true if a request was sent, false otherwise
     */
    setSaturation(value: number, transitionTime?: number): Promise<boolean>;
    /** Turns this object into JSON while leaving out the potential circular reference */
    toJSON(): {};
    /**
     * Fixes property values that are known to be bugged
     */
    fixBuggedProperties(): this;
}
export declare type Spectrum = "none" | "white" | "rgb";
