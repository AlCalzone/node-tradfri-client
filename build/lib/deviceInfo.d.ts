import { IPSOObject } from "./ipsoObject";
export declare enum PowerSources {
    Unknown = 0,
    InternalBattery = 1,
    ExternalBattery = 2,
    Battery = 3,
    PowerOverEthernet = 4,
    USB = 5,
    AC_Power = 6,
    Solar = 7
}
export declare class DeviceInfo extends IPSOObject {
    battery: number;
    firmwareVersion: string;
    manufacturer: string;
    modelNumber: string;
    power: PowerSources;
    otaImageType: string;
    serialNumber: number;
}
