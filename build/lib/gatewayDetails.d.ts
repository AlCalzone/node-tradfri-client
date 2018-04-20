import { IPSOObject } from "./ipsoObject";
/** contains information about the gateway */
export declare class GatewayDetails extends IPSOObject {
    alexaPairStatus: boolean;
    googleHomePairStatus: boolean;
    certificateProvisioned: boolean;
    commissioningMode: number;
    currentTimestamp: number;
    timeSource: number;
    ntpServerUrl: string;
    version: string;
    UNKNOWN1: string;
    UNKNOWN2: number;
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
    UNKNOWN12: string;
    forceOtaUpdateCheck: string;
    name: string;
}
export declare enum UpdatePriority {
    Normal = 0,
    Critical = 1,
    Required = 2,
    Forced = 5,
}
