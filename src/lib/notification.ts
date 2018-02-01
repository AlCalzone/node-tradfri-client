import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, ipsoKey, IPSOObject, PropertyTransform, required, serializeWith } from "./ipsoObject";

export class Notification extends IPSODevice {

	@ipsoKey("9015")
	public event: NotificationTypes = 0;

	@ipsoKey("9017")
	@deserializeWith(arr => parseNotificationDetails(arr), {splitArrays: false})
	public details: Record<string, string> = {};

	@ipsoKey("9014")
	public state: number = 0; // => ?

}

export enum NotificationTypes {
	NEW_FIRMWARE_AVAILABLE = 1001,
	GATEWAY_REBOOT_NOTIFICATION = 1003,
	UNKNOWN1 = 1004,
	UNKNOWN2 = 1005,
	LOSS_OF_INTERNET_CONNECTIVITY = 5001,
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
