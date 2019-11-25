import { UpdatePriority } from "./gatewayDetails";
import { IPSOObject } from "./ipsoObject";
export declare class Notification extends IPSOObject {
    timestamp: number;
    event: NotificationTypes;
    private _details;
    get details(): NotificationDetails;
    isActive: boolean;
    toJSON(): {
        timestamp: number;
        event: string;
        details: NotificationDetails;
        isActive: boolean;
    };
}
export declare class RebootNotification extends IPSOObject {
    reason: GatewayRebootReason;
    toJSON(): {
        reason: string;
    };
}
export declare class FirmwareUpdateNotification extends IPSOObject {
    releaseNotes: string;
    priority: UpdatePriority;
    toJSON(): {
        releaseNotes: string;
        priority: string;
    };
}
export declare type NotificationDetails = RebootNotification | FirmwareUpdateNotification | Record<string, string>;
export declare enum NotificationTypes {
    NewFirmwareAvailable = 1001,
    Reboot = 1003,
    UNKNOWN1 = 1004,
    UNKNOWN2 = 1005,
    LossOfInternetConnectivity = 5001
}
export declare enum GatewayRebootReason {
    "default" = -1,
    "firmware upgrade" = 0,
    "initiated by client" = 1,
    "homekit reset" = 3,
    "factory reset" = 2
}
