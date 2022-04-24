import { AirPurifierSetting } from "./airPurifierSetting";
import { BlindSetting } from "./blindSetting";
import { IPSODevice } from "./ipsoDevice";
import { LightSetting } from "./lightSetting";
import { PlugSetting } from "./plugSetting";
export declare class Scene extends IPSODevice {
    isActive: boolean;
    isPredefined: boolean;
    lightSettings: LightSetting[];
    blindSettings: BlindSetting[];
    plugSettings: PlugSetting[];
    airPurifierSettings: AirPurifierSetting[];
    sceneIndex: number;
    sceneIconId: number;
    coapVersion: string;
    useCurrentLightSettings: boolean;
}
