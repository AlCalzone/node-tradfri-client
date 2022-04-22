import { Accessory } from "./accessory";
import { IPSODevice } from "./ipsoDevice";
import { IPSOOptions } from "./ipsoObject";
export declare enum FanMode {
    Off = 0,
    Auto = 1,
    Level1 = 10,
    Level2 = 20,
    Level3 = 30,
    Level4 = 40,
    Level5 = 50
}
export declare type AirPurifierOperation = Partial<Pick<AirPurifier, "controlsLocked" | "fanMode" | "fanSpeed" | "statusLEDs">>;
export declare class AirPurifier extends IPSODevice {
    constructor(options?: IPSOOptions, accessory?: Accessory);
    private _modelName;
    private _accessory;
    airQuality: number | undefined;
    controlsLocked: boolean;
    fanMode: FanMode;
    fanSpeed: number;
    totalFilterLifetime: number;
    filterRuntime: number;
    filterRemainingLifetime: number;
    filterStatus: number;
    statusLEDs: boolean;
    totalMotorRuntime: number;
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
    /** Changes the fan mode of this air purifier */
    setFanMode(fanMode: FanMode): Promise<boolean>;
    /** Changes the fan speed of this air purifier */
    setFanSpeed(fanSpeed: number): Promise<boolean>;
    /** Locks or unlocks the controls on the air purifier */
    setControlsLocked(locked: boolean): Promise<boolean>;
    /** Enables or disables the status LEDs */
    setStatusLEDs(enabled: boolean): Promise<boolean>;
    private operateAirPurifier;
    /** Turns this object into JSON while leaving out the potential circular reference */
    toJSON(): {};
}
