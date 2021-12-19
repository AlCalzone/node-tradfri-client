import { FanMode } from "./airPurifier";
import { IPSODevice } from "./ipsoDevice";
import { ipsoKey } from "./ipsoObject";

export class AirPurifierSetting extends IPSODevice {
	@ipsoKey("5900")
	public fanMode: FanMode = FanMode.Off;
}
