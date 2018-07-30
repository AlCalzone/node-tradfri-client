export declare const endpoints: {
    devices: string;
    hsAccessoryLink: string;
    groups: string;
    scenes: string;
    notifications: string;
    smartTasks: string;
    gateway: (endpoint: GatewayEndpoints) => string;
};
export declare enum GatewayEndpoints {
    Reboot = "9030",
    Reset = "9031",
    UpdateFirmware = "9034",
    Authenticate = "9063",
    SEND_CERT_TO_GATEWAY = "9094",
    SEND_COGNITO_ID_TO_GATEWAY = "9095",
    SEND_GH_COGNITO_ID_TO_GATEWAY = "9104",
    Details = "15012"
}
