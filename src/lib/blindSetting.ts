import { IPSODevice } from "./ipsoDevice";
import { ipsoKey } from "./ipsoObject";

export class BlindSetting extends IPSODevice {
	@ipsoKey("5536")
	public position: number = 0.0; // <float>
}
