import { IPSODevice } from "./ipsoDevice";
import { LightSetting } from "./lightSetting";
export declare class Scene extends IPSODevice {
    isActive: boolean;
    isPredefined: boolean;
    lightSettings: LightSetting[];
    sceneIndex: number;
    useCurrentLightSettings: boolean;
}
