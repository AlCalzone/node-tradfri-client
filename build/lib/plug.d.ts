import { Accessory } from "./accessory";
import { IPSODevice } from "./ipsoDevice";
import { IPSOOptions } from "./ipsoObject";
export declare type PlugOperation = Partial<Pick<Plug, "onOff">>;
export declare class Plug extends IPSODevice {
    constructor(options?: IPSOOptions, accessory?: Accessory);
    private _modelName;
    private _accessory;
    onOff: boolean;
    /**
     * Returns true if the current plug is dimmable
     */
    readonly isDimmable: boolean;
    /**
     * Returns true if the current plug is switchable
     */
    readonly isSwitchable: boolean;
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
    /** Turns this object into JSON while leaving out the potential circular reference */
    toJSON(): {};
}
