import { deserializers, serializers } from "./conversions";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, ipsoKey, IPSOObject, PropertyTransform, required, serializeWith } from "./ipsoObject";

export class LightSetting extends IPSODevice {

	@ipsoKey("5706")
	public color: string = "f1e0b5"; // hex string

	@ipsoKey("5707")
	public hue: number = 0; // TODO: TODO: range unknown! [0-359]?
	@ipsoKey("5708")
	public saturation: number = 0; // TODO: range unknown!

	@ipsoKey("5709")
	public colorX: number = 0; // int
	@ipsoKey("5710")
	public colorY: number = 0; // int

	@ipsoKey("5711")
	public colorTemperature: number = 0; // TODO: range unknown!

	@ipsoKey("5851")
	@serializeWith(serializers.brightness)
	@deserializeWith(deserializers.brightness)
	public dimmer: number = 0; // <int> [0..100]

	@ipsoKey("5850")
	public onOff: boolean = false; // <bool>

}
