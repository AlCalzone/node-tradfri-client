import { IPSODevice } from "./ipsoDevice";
import { DictionaryLike } from "./object-polyfill";
import { Scene } from "./scene";
export interface GroupInfo {
    group: Group;
    scenes: DictionaryLike<Scene>;
}
export declare class Group extends IPSODevice {
    onOff: boolean;
    dimmer: number;
    sceneId: number;
    deviceIDs: number[];
    transitionTime: number;
}
export declare type GroupOperation = Partial<Pick<Group, "onOff" | "dimmer" | "sceneId" | "transitionTime">>;
