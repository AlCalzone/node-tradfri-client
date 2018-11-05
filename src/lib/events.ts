import { Overwrite as Merge } from "alcalzone-shared/types";
import { Accessory } from "./accessory";
import { GatewayDetails, UpdatePriority } from "./gatewayDetails";
import { Group } from "./group";
import { GatewayRebootReason } from "./notification";
import { Scene } from "./scene";

// =========================================
// Events related to initial connection
export type ConnectionFailedCallback = (attempt: number, maxAttempts: number) => void;

export interface ConnectionEventCallbacks {
	"connection failed": ConnectionFailedCallback;
}

export type ConnectionEvents = keyof ConnectionEventCallbacks;

// =========================================
// Connection watcher related events
export type ConnectionWatcherEvents =
	"ping succeeded" | "ping failed" |
	"connection alive" | "connection lost" |
	"gateway offline" |
	"reconnecting" |
	"give up"
	;

export type PingFailedCallback = (failedPingCount: number) => void;
export type ReconnectingCallback = (reconnectAttempt: number, maximumReconnects: number) => void;

export type ConnectionWatcherEventCallbacks = Merge<
	{ [K in ConnectionWatcherEvents]: () => void },
	{
		"ping failed": PingFailedCallback;
		"reconnecting": ReconnectingCallback;
	}
	>;

// =========================================
// Device-related events
export type DeviceUpdatedCallback = (device: Accessory) => void;
export type DeviceRemovedCallback = (instanceId: number) => void;
export type GroupUpdatedCallback = (group: Group) => void;
export type GroupRemovedCallback = (instanceId: number) => void;
export type SceneUpdatedCallback = (groupId: number, scene: Scene) => void;
export type SceneRemovedCallback = (groupId: number, instanceId: number) => void;
export type ErrorCallback = (e: Error) => void;
export type GatewayUpdatedCallback = (gateway: GatewayDetails) => void;

export interface ObservableEventCallbacks {
	"device updated": DeviceUpdatedCallback;
	"device removed": DeviceRemovedCallback;
	"group updated": GroupUpdatedCallback;
	"group removed": GroupRemovedCallback;
	"scene updated": SceneUpdatedCallback;
	"scene removed": SceneRemovedCallback;
	"gateway updated": GatewayUpdatedCallback;
	"error": ErrorCallback;
}
export type ObservableEvents = keyof ObservableEventCallbacks;

// =========================================
// Notification-related events
export type RebootNotificationCallback = (reason: keyof typeof GatewayRebootReason) => void;
export type FirmwareUpdateNotificationCallback = (releaseNotes: string, priority: keyof typeof UpdatePriority) => void;
export type InternetConnectivityChangedCallback = (connected: boolean) => void;

export interface NotificationEventCallbacks {
	"rebooting": RebootNotificationCallback;
	"internet connectivity changed": FirmwareUpdateNotificationCallback;
	"firmware update available": InternetConnectivityChangedCallback;
}
export type NotificationEvents = keyof NotificationEventCallbacks;

// =========================================
// All of the above
export type AllEventCallbacks = Merge<
	Merge<ObservableEventCallbacks, NotificationEventCallbacks>,
	Merge<ConnectionWatcherEventCallbacks, ConnectionEventCallbacks>
	>;
export type AllEvents = keyof AllEventCallbacks;
