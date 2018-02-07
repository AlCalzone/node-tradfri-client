import { deserializers, serializers } from "./conversions";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, ipsoKey, IPSOObject, PropertyTransform, required, serializeWith } from "./ipsoObject";
import { clamp } from "./math";
import { Scene } from "./scene";

export interface GroupInfo {
	group: Group;
	scenes: Record<string, Scene>;
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
	@serializeWith(ids => toAccessoryLink(ids), {splitArrays: false})
	public deviceIDs: number[];

	// The transition time is not reported by the gateway
	// but it accepts it for a state change
	@ipsoKey("5712")
	// force transition time to be present if brightness is
	// all other properties don't support the transition time
	@required((me: Group, ref: Group) => ref != null && me.dimmer !== ref.dimmer)
	@serializeWith(serializers.transitionTime, {neverSkip: true})
	@deserializeWith(deserializers.transitionTime, {neverSkip: true})
	public transitionTime: number; // <float>

	// =================================
	// Simplified API access
	/**
	 * Ensures this instance is linked to a tradfri client and an accessory
	 * @throws Throws an error if it isn't
	 */
	private ensureLink() {
		if (this.client == null) {
			throw new Error("Cannot use the simplified API on groups which aren't linked to a client instance.");
		}
	}

	/** Turn all lightbulbs on */
	public turnOn(): Promise<boolean> {
		this.ensureLink();
		return this.client.operateGroup(this, {
			onOff: true,
		});
	}

	/** Turn all lightbulbs off */
	public turnOff(): Promise<boolean> {
		this.ensureLink();
		return this.client.operateGroup(this, {
			onOff: false,
		});
	}

	/** Set all lightbulbs on/off to the given state */
	public toggle(value: boolean): Promise<boolean> {
		this.ensureLink();
		return this.client.operateGroup(this, {
			onOff: value,
		});
	}

	/** Activates the given scene */
	public activateScene(sceneOrId: Scene | number): Promise<boolean> {
		this.ensureLink();
		const id: number = (sceneOrId instanceof Scene) ? sceneOrId.instanceId : sceneOrId;
		return this.client.operateGroup(this, {
			sceneId: id,
		});
	}

	private operateGroup(operation: GroupOperation, transitionTime?: number): Promise<boolean> {
		if (transitionTime != null) {
			transitionTime = Math.max(0, transitionTime);
			operation.transitionTime = transitionTime;
		}
		return this.client.operateGroup(this, operation);
	}

	/**
	 * Changes this lightbulb's brightness
	 * @returns true if a request was sent, false otherwise
	 */
	public setBrightness(value: number, transitionTime?: number): Promise<boolean> {
		this.ensureLink();

		value = clamp(value, 0, 100);
		return this.operateGroup({
			dimmer: value,
		}, transitionTime);
	}

}

export type GroupOperation = Partial<Pick<Group, "onOff" | "dimmer" | "sceneId" | "transitionTime">>;

interface AccessoryLink {
	15002: {
		9003: number[];
	};
}

function parseAccessoryLink(link: AccessoryLink): number[] {
	const hsLink = link["15002"];
	const deviceIDs = hsLink["9003"];
	return deviceIDs;
}
function toAccessoryLink(ids: number[]): AccessoryLink {
	return {
		15002: {
			9003: ids,
		},
	};
}
