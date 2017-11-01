export declare enum TradfriErrorCodes {
    ConnectionFailed = 0,
    AuthenticationFailed = 1,
}
export declare class TradfriError extends Error {
    readonly message: string;
    readonly code: TradfriErrorCodes;
    constructor(message: string, code: TradfriErrorCodes);
}
