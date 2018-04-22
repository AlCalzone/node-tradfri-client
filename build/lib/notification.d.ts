import { IPSOObject } from "./ipsoObject";
export declare class Notification extends IPSOObject {
    timestamp: number;
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
export declare enum GatewayRebootReason {
    REBOOT_DEFAULT = -1,
    REBOOT_FIRMWARE_UPGRADE = 0,
    REBOOT_FROM_CLIENT = 1,
    REBOOT_HOMEKIT_RESET = 3,
    REBOOT_SOFT_RESET = 2,
}
