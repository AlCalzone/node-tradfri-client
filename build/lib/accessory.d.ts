import { DeviceInfo } from "./deviceInfo";
import { IPSODevice } from "./ipsoDevice";
import { Light } from "./light";
import { Plug } from "./plug";
import { Sensor } from "./sensor";
export declare enum AccessoryTypes {
    remote = 0,
    lightbulb = 2,
    motionSensor = 4,
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
    otaUpdateState: number;
    clone(): this;
    /**
     * Fixes property values that are known to be bugged
     */
    fixBuggedProperties(): this;
    restoreBuggedProperties(): this;
}
