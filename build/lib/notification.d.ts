import { IPSODevice } from "./ipsoDevice";
export declare class Notification extends IPSODevice {
    event: NotificationTypes;
    details: Record<string, string>;
    state: number;
}
export declare enum NotificationTypes {
    NEW_FIRMWARE_AVAILABLE = 1001,
    GATEWAY_REBOOT_NOTIFICATION = 1003,
    UNKNOWN1 = 1004,
    UNKNOWN2 = 1005,
    LOSS_OF_INTERNET_CONNECTIVITY = 5001,
}
