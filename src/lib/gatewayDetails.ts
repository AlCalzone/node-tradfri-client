import { deserializeWith, ipsoKey, IPSOObject, PropertyTransform, required, serializeWith } from "./ipsoObject";

/** contains information about the gateway */
/* istanbul ignore next */
export class GatewayDetails extends IPSOObject {

	@ipsoKey("9093")
	public alexaPairStatus: boolean;
	@ipsoKey("9105")
	public googleHomePairStatus: boolean;

	@ipsoKey("9093")
	public certificateProvisioned: boolean;

	@ipsoKey("9061")
	public commissioningMode: number = 0; // some enum => which one?

	@ipsoKey("9059")
	/** Current UTC time in seconds since 1970 (unix timestamp) */
	public utcNowUnixTimestamp: number = 0;
	@ipsoKey("9060")
	/** Current UTC time as XML (ISO) date */
	public utcNowISODate: string = "";

	@ipsoKey("9071")
	public timeSource: number = -1; // <int>

	@ipsoKey("9023")
	public ntpServerUrl: string = "";

	@ipsoKey("9029")
	public version: string = "";

	@ipsoKey("9062")
	public UNKNOWN_9062: number = 0; // <int> => something more with commissioning?

	@ipsoKey("9054")
	public otaUpdateState: boolean;
	@ipsoKey("9055")
	public updateProgress: number = 100;  // <int>
	@ipsoKey("9066")
	public updatePriority: UpdatePriority = UpdatePriority.Normal;
	@ipsoKey("9069")
	public updateAcceptedTimestamp: number = 0; // <int>
	@ipsoKey("9056")
	public releaseNotes: string = ""; // <string> => what is this?

	@ipsoKey("9072")
	public dstStartMonth: number = 0;
	@ipsoKey("9073")
	public dstStartDay: number = 0;
	@ipsoKey("9074")
	public dstStartHour: number = 0;
	@ipsoKey("9075")
	public dstStartMinute: number = 0;

	@ipsoKey("9076")
	public dstEndMonth: number = 0;
	@ipsoKey("9077")
	public dstEndDay: number = 0;
	@ipsoKey("9078")
	public dstEndHour: number = 0;
	@ipsoKey("9079")
	public dstEndMinute: number = 0;
	@ipsoKey("9080")
	public dstTimeOffset: number = 0;

	@ipsoKey("9081")
	public UNKNOWN_9081: string = ""; // some kind of hex code
	@ipsoKey("9082")
	public UNKNOWN_9082: boolean;
	@ipsoKey("9083")
	public UNKNOWN_9083: string; // some kind of serial number maybe?
	@ipsoKey("9092")
	public UNKNOWN_9092: number;
	@ipsoKey("9106")
	public UNKNOWN_9106: number;

	// are those used?
	@ipsoKey("9032")
	public forceOtaUpdateCheck: string = "";
	@ipsoKey("9035")
	public name: string = "";

}

export enum UpdatePriority {
	Normal = 0,
	Critical = 1,
	Required = 2,
	Forced = 5,
}
