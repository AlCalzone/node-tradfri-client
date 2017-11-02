import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, ipsoKey, IPSOObject, PropertyTransform, required, serializeWith } from "./ipsoObject";

/** contains information about the gateway */
export class GatewayDetails extends IPSOObject {

	@ipsoKey("9023")
	public ntpServerUrl: string = "";

	@ipsoKey("9029")
	public version: string = "";

	@ipsoKey("9054")
	public updateState: number = 0; // => which enum?

	@ipsoKey("9055")
	public updateProgress: number = 100;  // <int>

	@ipsoKey("9056")
	public updateDetailsURL: string = ""; // <string> => what is this?

	@ipsoKey("9059")
	public currentTimestamp: number = 0; // <long>

	@ipsoKey("9060")
	public UNKNOWN1: string = ""; // <string> => something to do with commissioning? XML-Date

	@ipsoKey("9061")
	public commissioningMode: number = 0; // <int> => which enum?

	@ipsoKey("9062")
	public UNKNOWN2: number = 0; // <int> => something more with commissioning?

	@ipsoKey("9066")
	public updatePriority: updatePriority = updatePriority.normal;

	@ipsoKey("9069")
	public updateAcceptedTimestamp: number = 0; // <int>

	@ipsoKey("9071")
	public timeSource: number = -1; // <int>

	@ipsoKey("9072")
	public UNKNOWN3: number = 0; // <int/bool> => what is this?
	@ipsoKey("9073")
	public UNKNOWN4: number = 0; // <int/bool> => what is this?
	@ipsoKey("9074")
	public UNKNOWN5: number = 0; // <int/bool> => what is this?
	@ipsoKey("9075")
	public UNKNOWN6: number = 0; // <int/bool> => what is this?
	@ipsoKey("9076")
	public UNKNOWN7: number = 0; // <int/bool> => what is this?
	@ipsoKey("9077")
	public UNKNOWN8: number = 0; // <int/bool> => what is this?
	@ipsoKey("9078")
	public UNKNOWN9: number = 0; // <int/bool> => what is this?
	@ipsoKey("9079")
	public UNKNOWN10: number = 0; // <int/bool> => what is this?
	@ipsoKey("9080")
	public UNKNOWN11: number = 0; // <int/bool> => what is this?
	@ipsoKey("9081")
	public UNKNOWN12: string = ""; // some kind of hex code

	// are those used?
	@ipsoKey("9032")
	public FORCE_CHECK_OTA_UPDATE: string = "";
	@ipsoKey("9035")
	public name: string = "";

}

export enum updatePriority {
	normal = 0,
	critical = 1,
	required = 2,
	forced = 5,
}
