import { Accessory } from "./accessory";
import { Group } from "./group";
import { Scene } from "./scene";

export type DeviceUpdatedCallback = (device: Accessory) => void;
export type DeviceRemovedCallback = (instanceId: number) => void;
export type GroupUpdatedCallback = (device: Group) => void;
export type GroupRemovedCallback = (instanceId: number) => void;
export type SceneUpdatedCallback = (groupId: number, scene: Scene) => void;
export type SceneRemovedCallback = (groupId: number, instanceId: number) => void;
export type ObserverCallback =
	DeviceUpdatedCallback | DeviceRemovedCallback |
	GroupUpdatedCallback | GroupRemovedCallback |
	SceneUpdatedCallback | SceneRemovedCallback
	;

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

export class TradfriObserver {

	private callbacks: ObserverCallbacks = {
		"device updated": [],
		"device removed": [],
		"group updated": [],
		"group removed": [],
		"scene updated": [],
		"scene removed": [],
	};

	// tslint:disable:unified-signatures
	public raise(event: "device updated", device: Accessory): this;
	public raise(event: "device removed", instanceId: number): this;
	public raise(event: "group updated", group: Group): this;
	public raise(event: "group removed", instanceId: number): this;
	public raise(event: "scene updated", groupId: number, scene: Scene): this;
	public raise(event: "scene removed", groupId: number, instanceId: number): this;
	public raise(event: keyof ObserverCallbacks, ...args: any[]): this {
		for (const cb of this.callbacks[event]) {
			// tslint:disable-next-line:ban-types
			(cb as Function).call(this._api, ...args);
		}
		return this;
	}
	// tslint:enable:unified-signatures

	private on(event: keyof ObserverCallbacks, callback: ObserverCallback): void {
		(this.callbacks[event] as any[]).push(callback);
	}

	private off(event: keyof ObserverCallbacks, callback?: ObserverCallback): void {
		if (callback != null) {
			// remove a special callback
			const index = (this.callbacks[event] as any[]).indexOf(callback);
			if (index > -1) this.callbacks[event].splice(index, 1);
		} else {
			// remove all callbacks
			this.callbacks[event] = [];
		}
	}

	private _api: TradfriObserverAPI;
	public getAPI(): TradfriObserverAPI {
		if (this._api == null) {
			this._api = {
				on: (event, callback) => {
					this.on(event, callback);
					return this._api;
				},
				off: (event, callback?) => {
					this.off(event, callback);
					return this._api;
				},
			};
		}
		return this._api;
	}

}
