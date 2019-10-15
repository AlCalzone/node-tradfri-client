import { BlindSetting } from "./blindSetting";
import { IPSODevice } from "./ipsoDevice";
import { LightSetting } from "./lightSetting";
export declare class Scene extends IPSODevice {
    isActive: boolean;
    isPredefined: boolean;
    lightSettings: LightSetting[];
    blindSettings: BlindSetting[];
    sceneIndex: number;
    useCurrentLightSettings: boolean;
}
