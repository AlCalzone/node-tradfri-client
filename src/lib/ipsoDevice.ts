import { deserializeWith, ipsoKey, IPSOObject, PropertyTransform, required, serializeWith } from "./ipsoObject";

// common base class for all devices
export class IPSODevice extends IPSOObject {

	@ipsoKey("9001")
	public name: string = "";

	@ipsoKey("9002")
	public createdAt: number = 0;

	@ipsoKey("9003")
	public instanceId: number = 0;

}
