import { Blind } from "./blind";
import { DeviceInfo } from "./deviceInfo";
import { IPSODevice } from "./ipsoDevice";
import { Light } from "./light";
import { Plug } from "./plug";
import { Sensor } from "./sensor";
export declare enum AccessoryTypes {
    /** A "normal" remote */
    remote = 0,
    /**
     * A remote which has been paired with another remote.
     * See https://www.reddit.com/r/tradfri/comments/6x1miq for details
     */
    slaveRemote = 1,
    /** A lightbulb */
    lightbulb = 2,
    /** A smart plug */
    plug = 3,
    /** A motion sensor (currently unsupported) */
    motionSensor = 4,
    /** A signal repeater */
    signalRepeater = 6,
    /** A smart blind */
    blind = 7,
    /** Symfonisk Remote */
    soundRemote = 8
}
export declare class Accessory extends IPSODevice {
    type: AccessoryTypes;
    deviceInfo: DeviceInfo;
    alive: boolean;
    lastSeen: number;
    lightList: Light[];
    plugList: Plug[];
    sensorList: Sensor[];
    switchList: IPSODevice[];
    repeaterList: IPSODevice[];
    blindList: Blind[];
    otaUpdateState: number;
    /**
     * Fixes property values that are known to be bugged
     */
    fixBuggedProperties(): this;
}
