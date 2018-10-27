import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, ipsoKey } from "./ipsoObject";
import { LightSetting } from "./lightSetting";
import { PlugSetting } from "./plugSetting";

export class Scene extends IPSODevice {

	@ipsoKey("9058")
	public isActive: boolean = false; // <bool>

	@ipsoKey("9068")
	public isPredefined: boolean = true; // <bool>

	@ipsoKey("15013")
	@deserializeWith(obj => new LightSetting().parse(obj))
	public lightSettings: LightSetting[] = [];

	// Plugs can be part of a scene but we need to find out how they are included
	// @ipsoKey("15015")
	// @deserializeWith(obj => new PlugSetting().parse(obj))
	// public plugSettings: PlugSetting[] = [];

	@ipsoKey("9057")
	public sceneIndex: number = 0; // <int>

	@ipsoKey("9070")
	public useCurrentLightSettings: boolean = false; // <bool>

}
