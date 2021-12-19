import { AirPurifierSetting } from "./airPurifierSetting";
import { BlindSetting } from "./blindSetting";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, doNotSerialize, ipsoKey } from "./ipsoObject";
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

	@ipsoKey("15016")
	@deserializeWith(obj => new BlindSetting().parse(obj))
	public blindSettings: BlindSetting[] = [];

	@ipsoKey("15021")
	@deserializeWith(obj => new PlugSetting().parse(obj))
	public plugSettings: PlugSetting[] = [];

	@ipsoKey("15026")
	@deserializeWith(obj => new AirPurifierSetting().parse(obj))
	public airPurifierSettings: AirPurifierSetting[] = [];

	@ipsoKey("9057")
	public sceneIndex: number = 0; // <int>

	@ipsoKey("9109")
	@doNotSerialize
	public sceneIconId: number = 0; // <int>

	@ipsoKey("9203")
	@doNotSerialize
	public coapVersion: string = "";

	@ipsoKey("9070")
	public useCurrentLightSettings: boolean = false; // <bool>

}
