import { Overwrite as Merge } from "alcalzone-shared/types";
import { Accessory } from "./accessory";
import { GatewayDetails, UpdatePriority } from "./gatewayDetails";
import { Group } from "./group";
import { GatewayRebootReason } from "./notification";
import { Scene } from "./scene";
export declare type ConnectionFailedCallback = (attempt: number, maxAttempts: number) => void;
export interface ConnectionEventCallbacks {
    "connection failed": ConnectionFailedCallback;
}
export declare type ConnectionEvents = keyof ConnectionEventCallbacks;
export declare type ConnectionWatcherEvents = "ping succeeded" | "ping failed" | "connection alive" | "connection lost" | "gateway offline" | "reconnecting" | "give up";
export declare type PingFailedCallback = (failedPingCount: number) => void;
export declare type ReconnectingCallback = (reconnectAttempt: number, maximumReconnects: number) => void;
export declare type ConnectionWatcherEventCallbacks = Merge<{
    [K in ConnectionWatcherEvents]: () => void;
}, {
    "ping failed": PingFailedCallback;
    "reconnecting": ReconnectingCallback;
}>;
export declare type DeviceUpdatedCallback = (device: Accessory) => void;
export declare type DeviceRemovedCallback = (instanceId: number) => void;
export declare type GroupUpdatedCallback = (group: Group) => void;
export declare type GroupRemovedCallback = (instanceId: number) => void;
export declare type SceneUpdatedCallback = (groupId: number, scene: Scene) => void;
export declare type SceneRemovedCallback = (groupId: number, instanceId: number) => void;
export declare type ErrorCallback = (e: Error) => void;
export declare type GatewayUpdatedCallback = (gateway: GatewayDetails) => void;
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
export declare type ObservableEvents = keyof ObservableEventCallbacks;
export declare type RebootNotificationCallback = (reason: keyof typeof GatewayRebootReason) => void;
export declare type FirmwareUpdateNotificationCallback = (releaseNotes: string, priority: keyof typeof UpdatePriority) => void;
export declare type InternetConnectivityChangedCallback = (connected: boolean) => void;
export interface NotificationEventCallbacks {
    "rebooting": RebootNotificationCallback;
    "internet connectivity changed": FirmwareUpdateNotificationCallback;
    "firmware update available": InternetConnectivityChangedCallback;
}
export declare type NotificationEvents = keyof NotificationEventCallbacks;
export declare type AllEventCallbacks = Merge<Merge<ObservableEventCallbacks, NotificationEventCallbacks>, Merge<ConnectionWatcherEventCallbacks, ConnectionEventCallbacks>>;
export declare type AllEvents = keyof AllEventCallbacks;
