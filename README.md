# node-tradfri-client
Library to talk to IKEA Trådfri Gateways without external binaries

[![node](https://img.shields.io/node/v/node-tradfri-client.svg) ![npm](https://img.shields.io/npm/v/node-tradfri-client.svg)](https://www.npmjs.com/package/node-tradfri-client)

[![Build Status](https://img.shields.io/circleci/project/github/AlCalzone/node-tradfri-client.svg)](https://circleci.com/gh/AlCalzone/node-tradfri-client)
[![Coverage Status](https://img.shields.io/coveralls/github/AlCalzone/node-tradfri-client.svg)](https://coveralls.io/github/AlCalzone/node-tradfri-client)

* [License](LICENSE)
* [Changelog](CHANGELOG.md)

## Example usage

### Discover a Gateway
```js
import { discoverGateway } from "node-tradfri-client";

// later:
const result = await discoverGateway();
```

The `result` variable has the following properties:
```js
{
    name: 'gw-abcdef012345',
    host: 'TRADFRI-Gateway-abcdef123456.local', // (optional!)
    version: '1.3.14',
    addresses: [
        // array of strings with IP addresses
    ]
}
```
Note about addresses and host attributes: the `addresses` array contains IPv4 and/or IPv6 addresses and will always contain at least one item. The host contains the mDNS name of the gateway - to use this host you need a working mDNS name resolution (should work out of the box for OSX, needs Name Service Switch service and Avahi).

### Common code for all examples
```TS
import { TradfriClient, Accessory, AccessoryTypes } from "node-tradfri-client";

// connect
const tradfri = new TradfriClient("gw-abcdef012345");
try {
    await tradfri.connect(identity, psk);
} catch (e) {
    // handle error - see below for details
}
```

### Make a lightbulb blink
```TS
// observe devices
tradfri
    .on("device updated", tradfri_deviceUpdated)
    .on("device removed", tradfri_deviceRemoved)
    .observeDevices()
;

const lightbulbs = {};
function tradfri_deviceUpdated(device: Accessory) {
    if (device.type === AccessoryTypes.lightbulb) {
        // remember it
        lightbulbs[device.instanceId] = device;
    }
}

function tradfri_deviceRemoved(instanceId: number) {
    // clean up
}

// later...
// at least after we have actually received the light object

const light = lightbulbs[65537].lightList[0];
// blink
setTimeout(() => light.toggle(), 0);
setTimeout(() => light.toggle(), 1000);
setTimeout(() => light.toggle(), 2000);
setTimeout(() => light.toggle(), 3000);

// even later...
// before shutting down the app
tradfri.destroy();
```

### Rename a group
```TS
// observe devices
tradfri
    .on("group updated", tradfri_groupUpdated)
    .observeGroupsAndScenes()
;

const groups = {};
function tradfri_groupUpdated(group: Group) {
    // remember it
    groups[group.instanceId] = group;
}

// later...
// at least after we have actually received the group object

const group = groups[123456];
group.name = "new name";
await tradfri.updateGroup(group);

// even later...
// before shutting down the app
tradfri.destroy();
```

## Detailed usage

### Import the necessary methods
```TS
const tradfriLib = require("node-tradfri-client");
// for normal usage:
const TradfriClient = tradfriLib.TradfriClient;
// for discovery:
const discoverGateway = tradfriLib.discoverGateway;

// or with the new import syntax
import { discoverGateway, TradfriClient /*, more imports */ } from "node-tradfri-client";
```

### Auto-detect your gateway
You can automatically discover a Trådfri gateway on the local network with the `discoverGateway` method. Discovery will return the first gateway found, finding multiple ones is not possible yet.

The method has the following signatures:
```TS
const discovered = await discoverGateway();
const discovered = await discoverGateway(timeout: number);
const discovered = await discoverGateway(false);
```
The timeout parameter is the time in milliseconds (default 10000) the discovery will run before returning `null` to indicate that no gateway was found. By passing a negative value or `false` you can instruct the discovery to run *forever*.

The return value is of the type `DiscoveredGateway` which looks as follows:
```ts
{
    // hostname of the gateway, has the form "gw-abcdef012345"
    name: string,
    // firmware version of the gateway
    version: string,
    // array of IP addresses the gateway responds to
    addresses: string[],
}
```


### Create a client instance
```TS
// one of the following
const tradfri = new TradfriClient(hostnameOrAddress: string);
const tradfri = new TradfriClient(hostnameOrAddress: string, customLogger: LoggerFunction);
const tradfri = new TradfriClient(hostnameOrAddress: string, options: TradfriOptions);
```
**Note:** It seems that in some networks you need to connect to the gateway using its hostname, while in other networks only the IP address works. As a result you have to try out which one works best for you.

As the 2nd parameter, you can provide a custom logger function or an object with some or all of the options shown below. By providing a custom logger function to the constructor, all diagnostic output will be sent to that function. By default, the `debug` module is used instead. The logger function has the following signature:
```TS
type LoggerFunction = (
    message: string,
    [severity: "info" | "warn" | "debug" | "error" | "silly"]
) => void;
```

The options object looks as follows:
```TS
interface TradfriOptions {
    customLogger: LoggerFunction,
    useRawCoAPValues: boolean,
    watchConnection: boolean | ConnectionWatcherOptions,
}
```
You can provide all the options or just some of them:
* The custom logger function is used as above.
* By setting `useRawCoAPValues` to true, you can instruct `TradfriClient` to use raw CoAP values instead of the simplified scales used internally. See below for a detailed description how the scales change.
* `watchConnection` accepts a `boolean` to enable/disable connection watching with default parameters or a set of options. See below ("watching the connection") for a detailed description.

The following code samples use the new `async/await` syntax which is available through TypeScript/Babel or in ES7. If that is no option for you, you can also consume the library by using promises:
```TS
try {
    const result = await asyncMethod(securityCode);
} catch (e) {
    // handle error
}
```
is equal to
```TS
asyncMethod(securityCode)
    .then((result) => {
        // work with the result
    })
    .catch((e) => {
        // handle error
    })
;
```

### Authentication
As of firmware version 1.2.42, the Trådfri Gateway requires generation of a unique identity before serving any requests. This step is not necessary if you already have a valid identity/psk pair.
To do so, call the `authenticate` method with the security code printed on the gateway:
```TS
try {
    const {identity, psk} = await tradfri.authenticate(securityCode);
    // store identity and psk
} catch (e) {
    // handle error
}
```
To comply with IKEA's requests, the security code **must not be stored** permanently in your application. Instead, store the returned `identity` and `psk` and use those for future connections to the gateway. 

If the authentication was not successful, this method throws (or rather rejects with) an error which you should handle. The error `e` should be of type `TradfriError` and gives further information why the authentication failed. To check that, add `TradfriError` and `TradfriErrorCodes` to the list of imports and check as follows:
```TS
if (e instanceof TradfriError) {
    switch (e.code) {
        case TradfriErrorCodes.ConnectionTimedOut: {
            // The gateway is unreachable or did not respond in time
        }
        case TradfriErrorCodes.AuthenticationFailed: {
            // The security code is wrong or something else went wrong with the authentication.
            // Check the error message for details. It might be that this library has to be updated
            // to be compatible with a new firmware.
        }
        case TradfriErrorCodes.ConnectionFailed: {
            // An unknown error happened while trying to connect
        }
    }
}
```

### Connecting to the gateway
When you have a valid identity and psk, you can connect to the gateway using the `connect` method:
```TS
try {
    await tradfri.connect(identity, psk);
} catch (e: TradfriError) {
    // handle error
    switch (e.code) {
        case TradfriErrorCodes.ConnectionTimedOut: {
            // The gateway is unreachable or did not respond in time
        }
        case TradfriErrorCodes.AuthenticationFailed: {
            // The provided credentials are not valid. You need to re-authenticate using `authenticate()`.
        }
        case TradfriErrorCodes.ConnectionFailed: {
            // An unknown error happened while trying to connect
        }
    }
}
```
If you have [automatic reconnection](#automatically-watching-the-connection-and-reconnecting) enabled, this method can retry for a long time before resolving or rejecting, depending on the configuration.

**NOTE:** As of v0.6.0, this no longer resolves with `false` if the connection was unsuccessful. Instead, it throws (or rejects with) a `TradfriError` which contains details about why the connection failed.  

### Pinging the gateway
```TS
const success = await tradfri.ping(
    [timeout: number]
);
```
Check the reachability of the gateway using inexpensive CoAP pings. The optional `timeout` parameter sets the time in ms (default: 5000) after which the ping fails. This is only possible after an initial connection to the gateway.

### Resetting the connection
```TS
tradfri.reset([preserveObservers: boolean]);
```
After a connection loss or reboot of the gateway, the currently active connection params might no longer be valid. In this case, use the reset method to invalidate the stored connection params, so the next request will use a fresh connection.

This causes all requests to be dropped and clears all observations. To preserve the observers, pass `true` to the method. When the connection is alive again, you can then call
```TS
await tradfri.restoreObservers();
```
to re-activate all observers and their callbacks.

**Note:** Promises belonging to any pending connections, requests or observers will not be fulfilled anymore and you should delete all references to them. In that case, the `"error"` event will be emitted (once or multiple times) with an error with code `TradfriClient.NetworkReset`.

### Closing the connection
```TS
tradfri.destroy();
```
Call this before shutting down your application so the gateway may clean up its resources.

### Subscribe to updates
The `TradfriClient` notifies registered listeners when observed resources are updated or removed. It is using the standard [`EventEmitter` interface](https://nodejs.org/api/events.html), so you can add listeners with `on("event", handler)` and remove them with `removeListener` and `removeAllListeners`.
The currently supported events and their handler signatures are:

#### `"device updated"` - A device was added or changed
```TS
type DeviceUpdatedCallback = (device: Accessory) => void;
```

#### `"device removed"` - A device was removed
```TS
type DeviceRemovedCallback = (instanceId: number) => void;
```

#### `"group updated"` - A group was added or changed
```TS
type GroupUpdatedCallback = (group: Group) => void;
```

#### `"group removed"` - A group was removed
```TS
type GroupRemovedCallback = (instanceId: number) => void;
```

#### `"scene updated"` - A scene (or "mood") was added to a group or changed
```TS
type SceneUpdatedCallback = (groupId: number, scene: Scene) => void;
```

#### `"scene removed"` - A scene (or "mood") was removed from a group
```TS
type SceneRemovedCallback = (groupId: number, instanceId: number) => void;
```

### Handle errors
The `"error"` event gets emitted when something unexpected happens. The callback has the following form:
```TS
type ErrorCallback = (e: Error) => void;
```
This doesn't have to be fatal, so you should check which kind of error happened.
Some errors are of the type `TradfriError` and contain a code which provides more information about the nature of the error. To check that, add `TradfriError` and `TradfriErrorCodes` to the list of imports and check as follows:
```TS
if (e instanceof TradfriError) {
    // handle the error depending on `e.code`
} else {
    // handle the error as you normally would.
}
```
The currently supported error codes are:
* `TradfriErrorCode.NetworkReset`: The `reset()` method was called while some requests or connection attempts were still pending. Those promises will not be fulfilled anymore, and you should delete all references to them.
* `TradfriErrorCode.ConnectionTimedOut`: While some requests or connection attempts were still pending, a secure connection could not be established within the timeout. The promises related to those requests or connection attempts will not be fulfilled anymore, and you should delete all references to them.

### Observe a resource
The standard way to receive updates to a Trådfri (or CoAP) resource is by observing it. The TradfriClient provides a couple of methods to observe resources, with the most generic one being
```TS
const success = await tradfri.observeResource(
    path: string,
    callback: (resp: CoapResponse) => void
);
```
The `path` argument determines which endpoint should be observed, e.g. `"15001"` for the list of devices. The callback is called for every response or update of the gateway. The method returns `true` if a new observer was set up, and `false` otherwise. If no new observer was set up, the provided callback **will not be called**.

To stop observing the resource and no longer receive updates, call
```TS
tradfri.stopObservingResource(path: string): void;
```
with the same path you used to setup the observer.

For a more detailed explanation of the `CoapResponse` object, please refer to the [node-coap-client documentation](https://github.com/AlCalzone/node-coap-client#request---fire-off-a-one-time-request-to-a-coap-resource).

**NOTE:** Prefer to use the specialized observer methods below whereever posible.

### Observe devices
By calling (or awaiting)
```TS
tradfri.observeDevices(): Promise<void>;
```
you can set up an observer for all devices on the gateway. The callbacks registered with `on("device updated")` and `on("device removed")` will now be called for updates.

Calling `stopObservingDevices()` stops the observation of devices and the callbacks will no longer be invoked.

### Observe groups and scenes ("moods")
By calling (or awaiting)
```TS
tradfri.observeGroupsAndScenes(): Promise<void>;
```
you can set up an observer for all groups and their scenes, which will call the callbacks for `"group updated"`, `"group removed"`, `"scene updated"` and `"scene removed"` on updates. Stopping this observer is possible by calling `stopObservingGroups()`.

**NOTE:** Keep in mind that (due to the gateway only reporting changes to every single bulb) switching a group on or off does **NOT** result in a callback! 

A `"group updated"` callback does occur when you:
* rename a group,
* remove or add devices to it, or
* redefine scene(s).  

### Observing the gateway details
Using
```TS
tradfri.observeGateway(): Promise<void>
```
you can set up an observer for the gateway details, which in turn will call the registered callbacks for `"gateway updated"` when something changes. The observation can be stopped by calling `tradfri.stopObservingGateway()`.

The object passed to the callback is of type `GatewayDetails` with the following properties:
* `alexaPairStatus: boolean` - Whether the gateway is paired with Amazon Alexa or not.
* `googleHomePairStatus: boolean` - Whether the gateway is paired with Google Home or not.
* `certificateProvisioned: boolean` - unknown
* `commissioningMode: number` - Meaning unknown. The possible values belong to some unknown enumeration.
* `utcNowUnixTimestamp: number` - Current UTC time as a unix timestamp (seconds since 1970-01-01).
* `utcNowISODate: string` - Current UTC time as an XML (ISO) date string. Includes milliseconds
* `timeSource: number` - The source of time information. Unsure what the values mean
* `ntpServerUrl: string` - The URL of the NTP server the gateway takes its time information from
* `version: string` - Version of the gateway firmware
* `otaUpdateState: boolean` - Whether a firmware update is available (probably)
* `updateProgress: number` - The percentage of the current updates's progress
* `updatePriority: UpdatePriority` - The priority of the firmware update. One of the following values:
  * `UpdatePriority.Normal (0)`
  * `UpdatePriority.Critical (1)`
  * `UpdatePriority.Required (2)`
  * `UpdatePriority.Forced (5)`
* `updateAcceptedTimestapm: number` - Unknown
* `releaseNotes: string` - Additional information about the update. Not sure if it's a changelog or just an URL.
* The timespan for the daylight saving's time is encoded in the following properties. Not sure if it's currently in use:
  * Start of DST: `dstStartMonth`, `dstStartDay`, `dstStartHour`, `dstStartMinute` (all numbers)
  * End of DST: `dstEndMonth`, `dstEndDay`, `dstEndHour`, `dstEndMinute` (all numbers)
  * `dstTimeOffset: number` - Unsure
* `forceOtaUpdateCheck: string` - Unknown
* `name: string` - Name of the gateway, seems unused

**Note:** Many properties are not completely understood at the moment. If you can provide more information, feel free to open an issue.

### Listening to notifications
Using
```TS
tradfri.observeNotifications(): Promise<void>
```
you can start listening to notifications events from the gateway. The observation can be stopped by calling `tradfri.stopObservingNotifications()`.

You can add listeners with `on("event", handler)` and remove them with `removeListener` and `removeAllListeners`. The currently supported events and their handler signatures are:

#### `"rebooting"` - The gateway is rebooting
```TS
type RebootNotificationCallback = (reason: string) => void;
```
where `reason` is one of:
* `"default"` - (unknown)
* `"firmware upgrade"`
* `"initiated by client"`
* `"homekit reset"`
* `"factory reset"`

#### `"internet connectivity changed"` - The status of the internet connection has changed
```TS
type InternetConnectivityChangedCallback = (connected: boolean) => void;
```
This also gets called at every start start with the current status of the internet connection.

#### `"firmware update available"` - A new firmware is available
```TS
type FirmwareUpdateNotificationCallback = (releaseNotes: string, priority: string) => void;
```
The argument `releaseNotes` contains an URL with the official release notes, `priority` is one of the following
* `"Normal"`
* `"Critical"`
* `"Required"`
* `"Forced"`

### Updating a device on the gateway
You can change properties of a device on the gateway (e.g. rename it) by calling
```TS
const requestSent = await tradfri.updateDevice(accessory: Accessory);
```
If the accessory object is not changed in comparison to the one on the gateway, no request will be sent and the return value will be `false`. The usage of this method **requires** that the devices are already being observed.

**NOTE:** To switch a light on/off or to change its properties, prefer the `operateLight` method or the specialized methods defined on the lightbulb itself.

```TS
const requestSent = await tradfri.operateLight(accessory: Accessory, operation: LightOperation[, force: boolean]);
```
The parameter `accessory` is the device containing the lightbulb. The `operation` object contains the properties to be updated, e.g.
```TS
{
    onOff: value,
    transitionTime: 5,
}
```
By setting the optional third parameter (`force`) to true, the entire `operation` object will be transmitted, even if no values have changed.

### Updating a group on the gateway
Similar to updating devices, you can update groups by calling
```TS
const requestSent = await tradfri.updateGroup(group: Group);
```

**NOTE:** To switch all lights in a group or to change their properties, prefer the `operateGroup` method.

```TS
const requestSent = await tradfri.operateGroup(
    group: Group,
    operation: GroupOperation,
    [force: boolean = false]
);
```
It is similar to the `operateLight` method, see the chapter [Data structures](#data-structure) below for a complete list of all properties. Because the gateway does not report back group properties, the sent payloads are computed using the old properties of the group. To ensure the entire `GroupOperation` is always present in the payload, set the `force` parameter to `true`. **Note:** `force = true` might become the default in a future release.

### Custom requests
For all one-time requests currently not possible through specialized methods, you can use
```TS
const response = await tradfri.request(
    path: string,
    method: "get" | "post" | "put" | "delete",
    [payload: object]
);
```
The `path` is the CoAP endpoint to be requested, the payload (if provided) must be a valid CoAP payload in JSON form. Upon completion, the promise resolved with a response object of the following form
```TS
{
    code: string,
    payload: string | object,
}
```
where the code is the string representation of one of the defined [CoAP message codes](https://tools.ietf.org/html/rfc7252#section-12.1.2) and the payload is either a string or a JSON object.

### Rebooting the gateway
Using 
```TS
tradfri.rebootGateway(): Promise<boolean>
```
you can reboot the gateway. The promise value determines if the reboot was started (`true`) or not (`false`).
A successful reboot is also indicated by a reboot notification (not implemented yet).

### Performing a factory reset on the gateway.
Using 
```TS
tradfri.resetGateway(): Promise<boolean>
```
you can factory reset the gateway. The promise value determines if the reboot was started (`true`) or not (`false`).

**Warning:** This wipes all configuration, including paired devices, groups and moods/scenes!

## Data structure

### `Accessory`
An Accessory is a generic device connected to the gateway. It can have several sub-devices, such as
* `Light`
* `Sensor`
* `Plug`
* `Switch` (no known devices exist)
although all currently known devices only have a single sub-device.

The properties available on an `Accessory` are:
* `name: string` - The name of this accessory as displayed in the app. Defaults to the model name.
* `createdAt: number` - The unix timestamp of the creation of the device. Unknown what this is exactly.
* `instanceId: number` - The ID under which the accessory is known to the gateway. Is used in callbacks throughout the library.
* `type: AccessoryTypes` - The type of the accessory. Currently, the following types are supported, but only the ones marked with `✔` contain any meaningful information:
  * `remote (0)` - A "normal" remote
  * `slaveRemote (1)` - A remote which has been paired with another remote. You can find details [here](https://www.reddit.com/r/tradfri/comments/6x1miq) on how to achieve this configuration.
  * `lightbulb (2)` - ✔ A lightbulb
  * `plug (3)` - ✔ A smart plug
  * `motionSensor (4)` - A motion sensor
  * `signalRepeater (6)` - A signal repeater
  * `blind (7)` - ✔ A smart blind
  * `soundRemote (8)` - Symfonisk Remote
  * `airPurifier (10)` - ✔ STARKVIND Air purifier
* `deviceInfo: DeviceInfo` - Some additional information about the device in form of a `DeviceInfo` object (see below)
* `alive: boolean` - Whether the gateway considers this device as alive.
* `lastSeen: number` - The unix timestamp of the last communication with the gateway.
* `lightList: Light[]` - An array of all lights belonging to this accessory. Is `undefined` for non-light devices.
* `plugList: Plug[]` - An array of all plugs belonging to this accessory. Is `undefined` for non-plug devices.
* `sensorList: Sensor[]` - An array of all sensors belonging to this accessory.
* `switchList: any[]` - An array of all switches belonging to this accessory. **Unsupported atm.**
* `blindList: Blind[]` - An array of all smart blinds belonging to this accessory.
* `airPurifierList: AirPurifier[]` - An array of all air purifiers belonging to this accessory.
* `otaUpdateState: number` - Unknown. Might be a `boolean`

### `Light`
A light represents a single lightbulb and has several properties describing its state. The supported properties depend on the spectrum of the lightbulb. All of them support the most basic properties:
* `dimmer: number` - The brightness in percent [0..100%]. _Note:_ When using raw values, this range is [0..254].
* `onOff: boolean` - If the lightbulb is on (`true`) or off (`false`)
* `transitionTime: number` - The duration of state changes in seconds. Default 0.5s, not supported for on/off.

as well as a few readonly properties:
* `isSwitchable: boolean` - Whether the lightbulb supports on/off.
* `isDimmable: boolean` - Whether the lightbulb supports setting the brightness.
* `spectrum: "none" | "white" | "rgb"` - The supported color spectrum of the lightbulb.

White spectrum lightbulbs also support
* `colorTemperature: number` - The color temperature in percent, where 0% equals cold white and 100% equals warm white. _Note:_ When using raw values, this range is 250 (cold) to 454 (warm).

RGB lightbulbs have the following properties:
* `color: string` - The 6 digit hex number representing the lightbulb's color. Don't use any prefixes like "#", only the hex number itself!
* `hue: number` - The color's hue [0..360°]. _Note:_ When using raw values, this range is [0..65279].
* `saturation: number` - The color's saturation [0..100%]. _Note:_ When using raw values, this range is [0..65279].

The additional properties are either for internal use (`colorX`/`colorY`) or not supported by the gateway. So don't use them!

If the light object was returned from a library function and not created by you, the following methods are available to change its appearance directly. You can `await` them to make sure the commands were sent or just fire-and-forget them. The returned `Promise`s resolve to `true` if a command was sent, otherwise to `false`.
* `turnOn()` - Turns the light on.
* `turnOff()` - Turns the light off.
* `toggle([value: boolean])` - Toggles the light's state to the given value or the opposite of its current state.
* `setBrightness(value: number [, transitionTime: number])` - Dims the light to the given brightness.
* `setColorTemperature(value: string [, transitionTime: number])` - Changes a white spectrum lightbulb's color temperature to the given value.
* `setColor(value: string [, transitionTime: number])` - Changes an RGB lightbulb's hex color to the given value. May also be use for white spectrum bulbs to target one of the predefined colors `f5faf6` (cold), `f1e0b5` (normal) and `efd275` (warm).
* `setHue(value: number [, transitionTime: number])` - Changes an RGB lightbulb's hue to the given value.
* `setSaturation(value: number [, transitionTime: number])` - Changes an RGB lightbulb's saturation to the given value.

For the methods accepting a transitionTime, you can specify an optional transition time or use the default of 0.5s.

### `LightOperation`
A LightOperation is an object containing at least one of a `Light`'s properties, which are:
```TS
{
    onOff: boolean;
    dimmer: number;
    transitionTime: number;
    colorTemperature: number;
    color: string;
    hue: number;
    saturation: number;
}
```
or a subset thereof.

### `Plug`
A plug represents a single outlet plug and has a single writable describing its state:
* `onOff: boolean` - If the plug is on (`true`) or off (`false`)

as well as a few readonly properties:
* `isSwitchable: boolean` - Whether the plug supports on/off (always `true`).
* `isDimmable: boolean` - Whether the plug supports setting the dimmer value (always `false` for now).

If the plug object was returned from a library function and not created by you, the following methods are available to change its state directly. Just like with lights, you can `await` them to make sure the commands were sent or just fire-and-forget them. The returned `Promise`s resolve to `true` if a command was sent, otherwise to `false`.
* `turnOn()` - Turns the plug on.
* `turnOff()` - Turns the plug off.
* `toggle([value: boolean])` - Toggles the plug's state to the given value or the opposite of its current state.
* `setBrightness(value: number)` - In order to keep compatibility with lights, plugs also have this method. Any value `>0` turns the plug on, `0` turns it off.

### `PlugOperation`
A `PlugOperation` is an object containing the desired on/off state of a `Plug`:
```TS
{
    onOff: boolean;
}
```

### `Group`
A group contains several devices, usually a remote control or dimmer and some lightbulbs. To control the group's lightbulbs, use the following properties:
* `onOff: boolean` - Turn the group's lightbulbs on (`true`) or off (`false`)
* `dimmer: number` - Set the brightness of the group's lightbulbs in percent [0..100%]. _Note:_ When using raw values, this range is [0..254].
* `transitionTime: number` - The duration of state changes in seconds. Not supported for on/off.
In contrast to controlling lightbulbs, the default transition time for groups is 0s (no transition).

**Note:** The Trådfri gateway does not update those values when lights change, so they should be considered write-only.

Additionally, these properties are also supported:
* `sceneId: number` - Set this to the `instanceId` of a scene (or "mood" as IKEA calls them), to activate it.
* `deviceIDs: number[]` - A **readonly** array of all `instanceId`s of the devices in this group.

Similar to lightbulbs, groups provide the following methods if they were returned from a library function. You can `await` them to make sure the commands were sent or just fire-and-forget them. The returned `Promise`s resolve to `true` if a command was sent, otherwise to `false`.
* `turnOn()` - Turns all lights on.
* `turnOff()` - Turns all lights off.
* `toggle(value: boolean)` - Sets all lights' state to the given value.
* `setBrightness(value: number [, transitionTime: number])` - Dims all lights to the given brightness.
* `setPosition(value: number)` - Moves all blinds to the given position.
* `stopBlinds()` - Stops all moving blinds.

### `GroupOperation`
A GroupOperation is an object containing at least one of a `Group`'s controllable properties, which are:
```TS
{
    onOff: boolean;
    dimmer: number;
    transitionTime: number;
    sceneId: number;
}
```
or a subset thereof.

### `Sensor` - Not supported

### `DeviceInfo`
A DeviceInfo object contains general information about a device. It has the following properties:
* `battery: number` - The battery percentage of a device. Only present if the device is battery-powered.
* `firmwareVersion: string` - The firmware version of the device
* `manufacturer: string` - The device manufacturer. Usually `"IKEA of Sweden"`.
* `modelNumber: string` - The name/type of the device, e.g. `"TRADFRI bulb E27 CWS opal 600lm"`
* `power: PowerSources` - How the device is powered. One of the following enum values:
    * `Unknown (0)`
    * `InternalBattery (1)`
    * `ExternalBattery (2)`
    * `Battery (3)` - Although not in the specs, this is apparently used by the remote
    * `PowerOverEthernet (4)`
    * `USB (5)`
    * `AC_Power (6)`
    * `Solar (7)`
* `serialNumber: string` - Not used currently. Always `""`


## Automatically watching the connection and reconnecting
**Note:** This feature is currently experimental

This library allows you to watch the connection and automatically reconnect without shipping your own reconnection routine. Retrying the initial connection is also possible **if you have already authenticated**.

You can enable it by setting the `watchConnection` param of the constructor options to `true` or an options object with the following structure:
```TS
interface ConnectionWatcherOptions {
    /** The interval in ms between consecutive pings */
    pingInterval: number; // DEFAULT: 10000ms
    /** How many pings have to consecutively fail until the gateway is assumed offline */
    failedPingCountUntilOffline: number; // DEFAULT: 1
    /**
     * How much the interval between consecutive pings should be increased
     * while the gateway is offline. The actual interval is calculated by
     * <ping interval> * <backoff factor> ** <offline pings)>,
     * with the number of offline pings capped at 5.
     */
    failedPingBackoffFactor: number; // DEFAULT: 1.5

    /** Whether automatic reconnection and retrying the initial connection is enabled */
    reconnectionEnabled: boolean; // DEFAULT: enabled
    /**
     * How many pings have to consecutively fail while the gateway is offline
     * until a reconnection is triggered
     */
    offlinePingCountUntilReconnect: number; // DEFAULT: 3
    /** After how many failed reconnects we give up */
    maximumReconnects: number; // DEFAULT: infinite

    /** How many tries for the initial connection should be attempted */
    maximumConnectionAttempts: number; // DEFAULT: infinite
    /** The interval in ms between consecutive connection attempts */
    connectionInterval: number; // DEFAULT: 10000ms
    /**
     * How much the interval between consecutive connection attempts
     * should be increased. The actual interval is calculated by
     * <connection interval> * <backoff factor> ** <failed attempts>
     * with the number of failed attempts capped at 5
     */
    failedConnectionBackoffFactor: number; // DEFAULT: 1.5

}
```
All parameters of this object are optional and use the default values if not provided. Monitoring the connection state is possible by subscribing to the following events, similar to [subscribing to updates](#subscribe-to-updates):

* `"ping succeeded"`: Pinging the gateway has succeeded. Callback arguments: none.
* `"ping failed"`: Pinging the gateway has failed one or multiple times in a row. Callback arguments:
  * `failedPingCount`: number
* `"connection lost"`: Raised after after the first failed ping. Callback arguments: none.
* `"connection failed"`: Raised when an attempt for the initial connection fails. Callback arguments:
  * `connectionAttempt`: number
  * `maximumAttempts`: number
* `"connection alive"`: The connection is alive again after one or more pings have failed. Callback arguments: none.
* `"gateway offline"`: The threshold for consecutive failed pings has been reached, so the gateway is assumed offline. Callback arguments: none.
* `"reconnecting"`: The threshold for failed pings while the gateway is offline has been reached. A reconnect attempt was started. Callback arguments:
  * `reconnectAttempt`: number
  * `maximumReconnects`: number
* `"give up"`: The maximum amount of reconnect attempts has been reached. No further attempts will be made until the connection is restored.

**Note:** Reconnection internally calls the `reset()` method. This means pending connections and promises will be dropped and the `"error"` event may be emitted aswell. See [resetting the connection](#resetting-the-connection) for details.

The automatic reconnection tries to restore all previously defined observers as soon as the connection is alive again.
