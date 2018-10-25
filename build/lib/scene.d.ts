import { IPSODevice } from "./ipsoDevice";
import { LightSetting } from "./lightSetting";
import { PlugSetting } from "./plugSetting";
export declare class Scene extends IPSODevice {
    isActive: boolean;
    isPredefined: boolean;
    lightSettings: LightSetting[];
    plugSettings: PlugSetting[];
    sceneIndex: number;
    useCurrentLightSettings: boolean;
}
