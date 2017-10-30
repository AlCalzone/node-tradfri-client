import { IPSODevice } from "./ipsoDevice";
export declare class Sensor extends IPSODevice {
    appType: string;
    sensorType: string;
    minMeasuredValue: number;
    maxMeasuredValue: number;
    minRangeValue: number;
    maxRangeValue: number;
    resetMinMaxMeasureValue: boolean;
    sensorValue: number;
    unit: string;
}
