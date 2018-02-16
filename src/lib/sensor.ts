import { deserializers, serializers } from "./conversions";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, ipsoKey, IPSOObject, PropertyTransform, required, serializeWith } from "./ipsoObject";

/* istanbul ignore next */
export class Sensor extends IPSODevice {

	@ipsoKey("5750")
	public appType: string = ""; // TODO: find out where this is defined
	@ipsoKey("5751")
	public sensorType: string = ""; // TODO: find out where this is defined

	@ipsoKey("5601")
	public minMeasuredValue: number = 0.0; // float
	@ipsoKey("5602")
	public maxMeasuredValue: number = 0.0; // float

	@ipsoKey("5603")
	public minRangeValue: number = 0.0; // float
	@ipsoKey("5604")
	public maxRangeValue: number = 0.0; // float

	@ipsoKey("5605")
	public resetMinMaxMeasureValue: boolean = false;

	@ipsoKey("5700")
	public sensorValue: number = 0.0; // float
	@ipsoKey("5701")
	public unit: string = "";

}
