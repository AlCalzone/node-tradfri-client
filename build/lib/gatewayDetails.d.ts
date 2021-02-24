import { IPSOObject } from "./ipsoObject";
/** contains information about the gateway */
export declare class GatewayDetails extends IPSOObject {
    alexaPairStatus: boolean;
    googleHomePairStatus: boolean;
    certificateProvisioned: boolean;
    commissioningMode: number;
    utcNowUnixTimestamp: number;
    utcNowISODate: string;
    timeSource: number;
    ntpServerUrl: string;
    version: string;
    UNKNOWN_9062: number;
    otaUpdateState: boolean;
    updateProgress: number;
    updatePriority: UpdatePriority;
    updateAcceptedTimestamp: number;
    releaseNotes: string;
    dstStartMonth: number;
    dstStartDay: number;
    dstStartHour: number;
    dstStartMinute: number;
    dstEndMonth: number;
    dstEndDay: number;
    dstEndHour: number;
    dstEndMinute: number;
    dstTimeOffset: number;
    UNKNOWN_9081: string;
    UNKNOWN_9082: boolean;
    UNKNOWN_9083: string;
    UNKNOWN_9106: number;
    forceOtaUpdateCheck: string;
    name: string;
}
export declare enum UpdatePriority {
    Normal = 0,
    Critical = 1,
    Required = 2,
    Forced = 5
}
