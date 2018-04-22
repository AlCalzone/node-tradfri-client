// list of known endpoints defined on the gateway
export const endpoints = {
	devices: "15001",
	hsAccessoryLink: "15002",
	groups: "15004",
	scenes: "15005",
	notifications: "15006",
	smartTasks: "15010",
	gateway: (endpoint: GatewayEndpoints) => `15011/${endpoint}`,
};

export enum GatewayEndpoints {
	Reboot = "9030",
	Reset = "9031",
	UpdateFirmware = "9034",
	Authenticate = "9063",
	SEND_CERT_TO_GATEWAY = "9094", // [?] observable
	SEND_COGNITO_ID_TO_GATEWAY = "9095", // [?] observable
	SEND_GH_COGNITO_ID_TO_GATEWAY = "9104", // [?] observable
	Details = "15012",
}

// export const gatewayEndpoints = {
// 	alexaCertificate: "9094", // DELETE or POST (raw string)
// 	alexa: "9095", // DELETE or POST (something with cognitoId)
// };
