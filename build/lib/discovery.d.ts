export interface DiscoveredGateway {
    name: string;
    host?: string;
    version: string;
    addresses: string[];
}
/**
 * Auto-discover a tradfri gateway on the network.
 * @param timeout (optional) Time in milliseconds to wait for a response. Default 10000.
 * Pass false or a negative number to explicitly wait forever.
 */
export declare function discoverGateway(timeout?: number | false): Promise<DiscoveredGateway | null>;
