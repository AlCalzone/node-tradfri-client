"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// list of known endpoints defined on the gateway
exports.endpoints = {
    devices: "15001",
    hsAccessoryLink: "15002",
    groups: "15004",
    scenes: "15005",
    notifications: "15006",
    smartTasks: "15010",
    gateway: (endpoint) => `15011/${endpoint}`,
};
var GatewayEndpoints;
(function (GatewayEndpoints) {
    GatewayEndpoints["Reboot"] = "9030";
    GatewayEndpoints["Reset"] = "9031";
    GatewayEndpoints["UpdateFirmware"] = "9034";
    GatewayEndpoints["Authenticate"] = "9063";
    GatewayEndpoints["SEND_CERT_TO_GATEWAY"] = "9094";
    GatewayEndpoints["SEND_COGNITO_ID_TO_GATEWAY"] = "9095";
    GatewayEndpoints["SEND_GH_COGNITO_ID_TO_GATEWAY"] = "9104";
    GatewayEndpoints["Details"] = "15012";
})(GatewayEndpoints = exports.GatewayEndpoints || (exports.GatewayEndpoints = {}));
// export const gatewayEndpoints = {
// 	alexaCertificate: "9094", // DELETE or POST (raw string)
// 	alexa: "9095", // DELETE or POST (something with cognitoId)
// };
