import { Accessory } from "./accessory";
import { IPSODevice } from "./ipsoDevice";
import { IPSOOptions } from "./ipsoObject";
export declare type PlugOperation = Partial<Pick<Plug, "onOff" | "dimmer">>;
export declare class Plug extends IPSODevice {
    constructor(options?: IPSOOptions, accessory?: Accessory);
    private _modelName;
    private _accessory;
    cumulativeActivePower: number;
    dimmer: number;
    onOff: boolean;
    onTime: number;
    powerFactor: number;
    /**
     * Returns true if the current plug is dimmable
     */
    get isDimmable(): boolean;
    /**
     * Returns true if the current plug is switchable
     */
    get isSwitchable(): boolean;
    clone(): this;
    /**
     * Creates a proxy which redirects the properties to the correct internal one, does nothing now
     */
    createProxy(): this;
    /**
     * Ensures this instance is linked to a tradfri client and an accessory
     * @throws Throws an error if it isn't
     */
    private ensureLink;
    /** Turn this plug on */
    turnOn(): Promise<boolean>;
    /** Turn this plug off */
    turnOff(): Promise<boolean>;
    /** Toggles this plug on or off */
    toggle(value?: boolean): Promise<boolean>;
    private operatePlug;
    /**
     * Changes this plug's "brightness". Any value > 0 turns the plug on, 0 turns it off.
     * @returns true if a request was sent, false otherwise
     */
    setBrightness(value: number): Promise<boolean>;
    /** Turns this object into JSON while leaving out the potential circular reference */
    toJSON(): {};
}
