import { Accessory } from "./accessory";
import { Group } from "./group";
import { Scene } from "./scene";
export declare type DeviceUpdatedCallback = (device: Accessory) => void;
export declare type DeviceRemovedCallback = (instanceId: number) => void;
export declare type GroupUpdatedCallback = (device: Group) => void;
export declare type GroupRemovedCallback = (instanceId: number) => void;
export declare type SceneUpdatedCallback = (groupId: number, scene: Scene) => void;
export declare type SceneRemovedCallback = (groupId: number, instanceId: number) => void;
export declare type ObserverCallback = DeviceUpdatedCallback | DeviceRemovedCallback | GroupUpdatedCallback | GroupRemovedCallback | SceneUpdatedCallback | SceneRemovedCallback;
export interface ObserverCallbacks {
    "device updated": DeviceUpdatedCallback[];
    "device removed": DeviceRemovedCallback[];
    "group updated": GroupUpdatedCallback[];
    "group removed": GroupRemovedCallback[];
    "scene updated": SceneUpdatedCallback[];
    "scene removed": SceneRemovedCallback[];
}
export interface TradfriObserverAPI {
    on(event: "device updated", callback: DeviceUpdatedCallback): this;
    on(event: "device removed", callback: DeviceRemovedCallback): this;
    on(event: "group updated", callback: GroupUpdatedCallback): this;
    on(event: "group removed", callback: GroupRemovedCallback): this;
    on(event: "scene updated", callback: SceneUpdatedCallback): this;
    on(event: "scene removed", callback: SceneRemovedCallback): this;
    off(event: "device updated", callback?: DeviceUpdatedCallback): this;
    off(event: "device removed", callback?: DeviceRemovedCallback): this;
    off(event: "group updated", callback?: GroupUpdatedCallback): this;
    off(event: "group removed", callback?: GroupRemovedCallback): this;
    off(event: "scene updated", callback?: SceneUpdatedCallback): this;
    off(event: "scene removed", callback?: SceneRemovedCallback): this;
}
export declare class TradfriObserver {
    private callbacks;
    raise(event: "device updated", device: Accessory): this;
    raise(event: "device removed", instanceId: number): this;
    raise(event: "group updated", group: Group): this;
    raise(event: "group removed", instanceId: number): this;
    raise(event: "scene updated", groupId: number, scene: Scene): this;
    raise(event: "scene removed", groupId: number, instanceId: number): this;
    private on(event, callback);
    private off(event, callback?);
    private _api;
    getAPI(): TradfriObserverAPI;
}
