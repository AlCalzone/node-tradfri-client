export declare enum TradfriErrorCodes {
    ConnectionFailed = 0,
    ConnectionTimedOut = 1,
    AuthenticationFailed = 2,
    NetworkReset = 3
}
export declare class TradfriError extends Error {
    readonly message: string;
    readonly code: TradfriErrorCodes;
    constructor(message: string, code: TradfriErrorCodes);
}
