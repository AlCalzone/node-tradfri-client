import { IPSODevice } from "./ipsoDevice";
export declare class Plug extends IPSODevice {
    cumulativeActivePower: number;
    dimmer: number;
    onOff: boolean;
    onTime: number;
    powerFactor: number;
}
