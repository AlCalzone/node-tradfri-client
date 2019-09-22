import { BlindSetting } from "./blindSetting";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, ipsoKey } from "./ipsoObject";
import { LightSetting } from "./lightSetting";

export class Scene extends IPSODevice {

	@ipsoKey("9058")
	public isActive: boolean = false; // <bool>

	@ipsoKey("9068")
	public isPredefined: boolean = true; // <bool>

	// Plugs can be part of a scene but we need to find out how they are included
	// I currently believe that they are part of this, as LightSettings are a superset
	// of the available settings for plugs.
	@ipsoKey("15013")
	@deserializeWith(obj => new LightSetting().parse(obj))
	public lightSettings: LightSetting[] = [];

	@ipsoKey("15016")
	@deserializeWith(obj => new BlindSetting().parse(obj))
	public blindSettings: BlindSetting[] = [];

	@ipsoKey("9057")
	public sceneIndex: number = 0; // <int>

	@ipsoKey("9070")
	public useCurrentLightSettings: boolean = false; // <bool>

}
