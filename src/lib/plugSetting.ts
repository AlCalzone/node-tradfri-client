import { IPSODevice } from "./ipsoDevice";
import { ipsoKey } from "./ipsoObject";

export class PlugSetting extends IPSODevice {

	@ipsoKey("5850")
	public onOff: boolean = false; // <bool>

}
