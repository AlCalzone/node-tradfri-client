import { IPSODevice } from "./ipsoDevice";
import { LightSetting } from "./lightSetting";
import { BlindSetting } from "./blindSetting";
export declare class Scene extends IPSODevice {
    isActive: boolean;
    isPredefined: boolean;
    lightSettings: LightSetting[];
    blindSettings: BlindSetting[];
    sceneIndex: number;
    useCurrentLightSettings: boolean;
}
