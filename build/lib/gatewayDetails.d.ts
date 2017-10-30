import { IPSODevice } from "./ipsoDevice";
/** contains information about the gateway */
export declare class GatewayDetails extends IPSODevice {
    ntpServerUrl: string;
    version: string;
    updateState: number;
    updateProgress: number;
    updateDetailsURL: string;
    currentTimestamp: number;
    UNKNOWN1: string;
    commissioningMode: number;
    UNKNOWN2: number;
    updatePriority: updatePriority;
    updateAcceptedTimestamp: number;
    timeSource: number;
    UNKNOWN3: number;
    UNKNOWN4: number;
    UNKNOWN5: number;
    UNKNOWN6: number;
    UNKNOWN7: number;
    UNKNOWN8: number;
    UNKNOWN9: number;
    UNKNOWN10: number;
    UNKNOWN11: number;
    UNKNOWN12: string;
    FORCE_CHECK_OTA_UPDATE: string;
    name: string;
}
export declare enum updatePriority {
    normal = 0,
    critical = 1,
    required = 2,
    forced = 5,
}
