import { deserializers, serializers } from "./conversions";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, ipsoKey, IPSOObject, PropertyTransform, required, serializeWith } from "./ipsoObject";
import { DictionaryLike } from "./object-polyfill";
import { Scene } from "./scene";

export interface GroupInfo {
	group: Group;
	scenes: DictionaryLike<Scene>;
}

export class Group extends IPSODevice {

	@ipsoKey("5850")
	@required((me: Group, ref: Group) => ref != null && me.sceneId !== ref.sceneId) // force on/off to be present if sceneId is
	public onOff: boolean; // <bool>

	@ipsoKey("5851")
	@serializeWith(serializers.brightness)
	@deserializeWith(deserializers.brightness)
	public dimmer: number; // <int> [0..100]

	@ipsoKey("9039")
	public sceneId: number;

	@ipsoKey("9018")
	@deserializeWith(obj => parseAccessoryLink(obj))
	@serializeWith(ids => toAccessoryLink(ids), false)
	public deviceIDs: number[];

	// The transition time is not reported by the gateway
	// but it accepts it for a state change
	@ipsoKey("5712")
	// force transition time to be present if brightness is
	// all other properties don't support the transition time
	@required((me: Group, ref: Group) => ref != null && me.dimmer !== ref.dimmer)
	@serializeWith(serializers.transitionTime)
	@deserializeWith(deserializers.transitionTime)
	public transitionTime: number; // <float>

}

export type GroupOperation = Partial<Pick<Group, "onOff" | "dimmer" | "sceneId" | "transitionTime">>;

// TODO: Type annotation
function parseAccessoryLink(link): number[] {
	const hsLink = link["15002"];
	const deviceIDs = hsLink["9003"];
	return deviceIDs;
}
function toAccessoryLink(ids: number[]): any {
	return {
		15002: {
			9003: ids,
		},
	};
}
