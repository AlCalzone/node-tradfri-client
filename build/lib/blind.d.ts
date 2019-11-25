import { Accessory } from "./accessory";
import { IPSODevice } from "./ipsoDevice";
import { IPSOOptions } from "./ipsoObject";
export declare type BlindOperation = Partial<Pick<Blind, "position" | "trigger">>;
export declare class Blind extends IPSODevice {
    constructor(options?: IPSOOptions, accessory?: Accessory);
    private _modelName;
    private _accessory;
    position: number;
    trigger: number | undefined;
    /**
     * Returns true if the current blind is dimmable
     */
    get isDimmable(): boolean;
    /**
     * Returns true if the current blind is switchable
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
    /** Open these blinds */
    open(): Promise<boolean>;
    /** Close these blinds */
    close(): Promise<boolean>;
    /** Stops moving blinds */
    stop(): Promise<boolean>;
    private operateBlind;
    /**
     * Sets this blind's position. 0 is closed, 100 is open.
     * @returns true if a request was sent, false otherwise
     */
    setPosition(value: number): Promise<boolean>;
    /** Turns this object into JSON while leaving out the potential circular reference */
    toJSON(): {};
}
