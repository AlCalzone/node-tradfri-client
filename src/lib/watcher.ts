/** Configures options for connection watching and automatic reconnection */
export interface ConnectionWatcher {
	/** Whether watching the connection is enabled */
	watchEnabled: boolean;
	/** The interval in ms between consecutive pings */
	pingInterval: number;
	/** How many pings have to consecutively fail until the gateway is assumed offline */
	failedPingCountUntilOffline: number;
	/**
	 * How much the interval between consecutive pings should be increased while the gateway is offline.
	 * The actual interval is calculated by <min(5, # offline pings)> * <backoff factor> * <ping interval>
	 */
	failedPingBackoffFactor: number;

	/** Whether automatic reconnection is enabled */
	reconnectionEnabled: boolean;
	/** How many pings have to consecutively fail while the gateway is offline until a reconnection is triggered */
	offlinePingCountUntilReconnect: number;
	/** After how many failed reconnects we give up. Number.POSITIVE_INFINITY to never gonna give you up, never gonna let you down... */
	maximumReconnects: number;
}

export class ConnectionWatcher {
	// TODO
}
