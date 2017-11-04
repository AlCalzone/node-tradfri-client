import { TradfriClient } from "../tradfri-client";
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
    /**
     * Link this object to a TradfriClient for a simplified API.
     * INTERNAL USE ONLY!
     * @param client The client instance to link this object to
     */
    link(client: TradfriClient): this;
}
