import { UpdatePriority } from "./gatewayDetails";
import { deserializeWith, ipsoKey, IPSOObject } from "./ipsoObject";

export class Notification extends IPSOObject {

	@ipsoKey("9002")
	public timestamp: number = 0; // Timestamp of the notification as unix time

	@ipsoKey("9015")
	public event: NotificationTypes = 0;

	@ipsoKey("9017")
	@deserializeWith(arr => parseNotificationDetails(arr), { splitArrays: false })
	private _details: NotificationDetails = {};
	public get details(): NotificationDetails {
		return this.event === NotificationTypes.Reboot ? (new RebootNotification().parse(this._details))
			: this.event === NotificationTypes.NewFirmwareAvailable ? (new FirmwareUpdateNotification().parse(this._details))
			: this._details;
	}

	@ipsoKey("9014")
	public isActive: boolean = false;

	public toJSON() {
		return {
			timestamp: this.timestamp,
			event: NotificationTypes[this.event],
			details: this.details,
			isActive: this.isActive,
		};
	}

}

// These classes are only read, so their properties must be defined
export class RebootNotification extends IPSOObject {

	@ipsoKey("9052")
	public reason!: GatewayRebootReason;

	public toJSON() {
		return {
			reason: GatewayRebootReason[this.reason],
		};
	}

}

export class FirmwareUpdateNotification extends IPSOObject {

	@ipsoKey("9056")
	public releaseNotes!: string;

	@ipsoKey("9066")
	@deserializeWith(str => parseInt(str, 10))
	public priority!: UpdatePriority;

	public toJSON() {
		return {
			releaseNotes: this.releaseNotes,
			priority: UpdatePriority[this.priority],
		};
	}

}

export type NotificationDetails = RebootNotification | FirmwareUpdateNotification | Record<string, string>;

export enum NotificationTypes {
	NewFirmwareAvailable = 1001,
	Reboot = 1003,
	UNKNOWN1 = 1004, // Might have something to do with devices
	UNKNOWN2 = 1005,
	LossOfInternetConnectivity = 5001,
}

export enum GatewayRebootReason {
	"default" = -1,
	"firmware upgrade" = 0,
	"initiated by client" = 1,
	"homekit reset" = 3,
	"factory reset" = 2,
}

/**
 * Turns a key=value-Array into a Dictionary object
 */
function parseNotificationDetails(kvpList: string[]): Record<string, string> {
	const ret: Record<string, string> = {};
	for (const kvp of kvpList) {
		const parts = kvp.split("=");
		ret[parts[0]] = parts[1];
	}
	return ret;
}
