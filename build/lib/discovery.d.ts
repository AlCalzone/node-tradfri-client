export interface DiscoveredGateway {
    name: string;
    version: string;
    addresses: string[];
}
export declare function discoverGateway(): Promise<DiscoveredGateway>;
