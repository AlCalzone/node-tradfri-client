# node-tradfri-client
Library to talk to IKEA Trådfri Gateways without external binaries

[![node](https://img.shields.io/node/v/node-tradfri-client.svg) ![npm](https://img.shields.io/npm/v/node-tradfri-client.svg)](https://www.npmjs.com/package/node-tradfri-client)

[![Build Status](https://img.shields.io/circleci/project/github/AlCalzone/node-tradfri-client.svg)](https://circleci.com/gh/AlCalzone/node-tradfri-client)
[![Coverage Status](https://img.shields.io/coveralls/github/AlCalzone/node-tradfri-client.svg)](https://coveralls.io/github/AlCalzone/node-tradfri-client)

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
    version: '1.3.14',
    addresses: [ 
        // array of strings with IP addresses
    ]
}
```


### Common code for all examples
```TS
import { TradfriClient, Accessory, AccessoryTypes } from "node-tradfri-client";

// connect
const tradfri = new TradfriClient("gw-abcdef012345");
await tradfri.connect(identity, psk);
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
const tradfri = new TradfriClient(hostname: string);
const tradfri = new TradfriClient(hostname: string, customLogger: LoggerFunction);
const tradfri = new TradfriClient(hostname: string, options: TradfriOptions);
```
As the 2nd parameter, you can provide a custom logger function or some options. By providing a custom logger function to the constructor, all diagnostic output will be sent to that function. By default, the `debug` module is used instead. The logger function has the following signature:
```TS
type LoggerFunction = (
    message: string,
    [severity: "info" | "warn" | "debug" | "error" | "silly"]
) => void;
```

The options object looks as follows:
```TS
interface TradfriOptions {
	customLogger?: LoggerFunction,
	useRawCoAPValues?: boolean,
}
```
The custom logger function is used as above. By setting `useRawCoAPValues` to true, you can instruct `TradfriClient` to use raw CoAP values instead of the simplified scales used internally. See below for a detailed description how the scales change.

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
The returned `identity` and `psk` **have to be stored** for future connections to the gateway. To comply with IKEA's requests, the security code **must not be stored** permanently in your application.

The call throws an error if it wasn't successful which you should handle. The error `e` should be of type `TradfriError` and gives further information why the authentication failed. To check that, add `TradfriError` and `TradfriErrorCodes` to the list of imports and check as follows:
```TS
if (e instanceof TradfriError) {
    switch (e.code) {
        case TradfriErrorCodes.ConnectionFailed: {
            // Gateway unreachable or security code wrong
        }
        case TradfriErrorCodes.AuthenticationFailed: {
            // Something went wrong with the authentication.
            // It might be that this library has to be updated to be compatible with a new firmware.
        }
    }
}
```

### Connecting to the gateway
When you have a valid identity and psk, you can connect to the gateway using the `connect` method:
```TS
const success = await tradfri.connect(identity, psk);
```
If the connection was unsuccessful, either the gateway was unreachable or the identity/psk pair isn't valid.

### Pinging the gateway
```TS
const success = await tradfri.ping(
    [timeout: number]
);
```
Check the reachability of the gateway using inexpensive CoAP pings. The optional `timeout` parameter sets the time in ms (default: 5000) after which the ping fails. This is only possible after an initial connection to the gateway.

### Resetting the connection
```TS
tradfri.reset();
```
After a connection loss or reboot of another endpoint, the currently active connection params might no longer be valid. In this case, use the reset method to invalidate the stored connection params, so the next request will use a fresh connection.

This causes all requests to be dropped and clears all observations. 

**Note:** Promises belonging to any pending connections, requests or observers will not be fulfilled anymore and you should delete all references to them. In that case, the `"error"` event will be emitted (once or multiple times) with an error with code `TradfriClient.NetworkReset`.

### Closing the connection
```TS
tradfri.destroy();
```
Call this before shutting down your application so the gateway may clean up its resources.

### Subscribe to updates
The `TradfriClient` notifies registered listeners when observed resources are updated or removed. It is using the standard `EventEmitter` [interface](https://nodejs.org/api/events.html), so you can add listeners with `on("event", handler)` and remove them with `removeListener` and `removeAllListeners`.
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
The `"error"` event gets emitted when something unexpected happens. The callback has the following form.
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

### Updating a device on the gateway
You can change properties of a device on the gateway (e.g. rename it) by calling
```TS
const requestSent = await tradfri.updateDevice(accessory: Accessory);
```
If the accessory object is not changed in comparison to the one on the gateway, no request will be sent and the return value will be `false`. The usage of this method **requires** that the devices are already being observed.

**NOTE:** To switch a light on/off or to change its properties, prefer the `operateLight` method or the specialized methods defined on the lightbulb itself.

```TS
const requestSent = await tradfri.operateLight(accessory: Accessory, operation: LightOperation);
```
The parameter `accessory` is the device containing the lightbulb. The `operation` object contains the properties to be updated, e.g.
```TS
{
    onOff: value,
    transitionTime: 5,
}
```

### Updating a group on the gateway
Similar to updating devices, you can update groups by calling
```TS
const requestSent = await tradfri.updateGroup(group: Group);
```

**NOTE:** To switch all lights in a group or to change their properties, prefer the `operateGroup` method.

```TS
const requestSent = await tradfri.operateGroup(group: Group, operation: GroupOperation);
```
It is similar to the `operateLight` method, see the chapter "Data structures" below for a complete list of all properties.

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
* `type: AccessoryTypes` - The type of the accessory: `remote (0)`, `lightbulb (2)` or `motionSensor (4)`. Currently only lightbulbs contain meaningful information.
* `deviceInfo: DeviceInfo` - Some additional information about the device in form of a `DeviceInfo` object (see below)
* `alive: boolean` - Whether the gateway considers this device as alive.
* `lastSeen: number` - The unix timestamp of the last communication with the gateway.
* `lightList: Light[]` - An array of all lights belonging to this accessory.
* `plugList: Plug[]` - An array of all plugs belonging to this accessory.
* `sensorList: Sensor[]` - An array of all sensors belonging to this accessory.
* `switchList: any[]` - An array of all switches belonging to this accessory. **Unsupported atm.**
* `otaUpdateState: number` - Unknown. Might be a boolean

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

If the light object was returned from a library function and not created by you, the following methods are available to change its appearance directly. You can await them to make sure the commands were sent or just fire-and-forget them. The returned Promises resolve to true if a command was sent, otherwise to false.
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

Similar to lightbulbs, groups provide the following methods if they were returned from a library function. You can await them to make sure the commands were sent or just fire-and-forget them. The returned Promises resolve to true if a command was sent, otherwise to false.
* `turnOn()` - Turns all lights on.
* `turnOff()` - Turns all lights off.
* `toggle(value: boolean)` - Sets all lights' state to the given value.
* `setBrightness(value: number [, transitionTime: number])` - Dims all lights to the given brightness.

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

### `Plug`, `Sensor` - Not supported

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

## Changelog

#### NEXT:
* (AlCalzone) Swallow `"CoapClient was reset"` promise rejections and emit an `"error"` instead

#### 0.9.1 (2018-03-09)
* (AlCalzone) Fix properties which are wrongly reported by the gateway

#### 0.9.0 (2018-03-09)
* (neophob) Added gateway discovery
* (AlCalzone) Added timeout and tests for gateway discovery

#### 0.8.7 (2018-03-08)
* (AlCalzone) Greatly enhanced test coverage
* (AlCalzone) Fixed some minor issues found by the new tests

#### 0.8.6 (2018-03-07)
* (AlCalzone) Published bugfixes that should have been live already.

#### 0.8.5 (2018-02-27)
* (AlCalzone) Updated `node-coap-client`

#### 0.8.4 (2018-02-23)
* (AlCalzone) Fixed `Group.activateScene` when the scene was already selected

#### 0.8.3 (2018-02-22)
* (AlCalzone) Removed the recently-added payload merging because it did more harm than good
* (AlCalzone) Fixed `Group.activateScene` when the lights are turned off

#### 0.8.2 (2018-02-19)
* (AlCalzone) Force `hue` and `saturation` to appear in pairs in the sent payload

#### 0.8.1 (2018-02-15)
* (AlCalzone) Support floating point numbers as property values

#### 0.8.0 (2018-02-15)
* (AlCalzone) Use the `hue` and `saturation` CoAP properties directly instead of `colorX/Y`

#### 0.7.2 (2018-02-07)
* (AlCalzone) Attempt to fix `TypeError: generator already running` in ioBroker.tradfri

#### 0.7.1 (2018-02-06)
* (AlCalzone) Update coap/dtls libs: Fixed an error in the cipher suite definitions

#### 0.7.0 (2018-01-28)
* (AlCalzone) Support using raw CoAP values instead of the simplified scales for many properties.

#### 0.6.0 (2018-01-13)
* (AlCalzone) Use the `colorTemperature` CoAP property directly instead of `colorX/Y`

#### 0.5.6 (2018-01-10)
* (AlCalzone) Added stub property for IPSO key `5717` in Light objects to remove warnings for Gateway v1.3.14

#### 0.5.5 (2017-12-25)
* (AlCalzone) Fixed a null reference in `observeGroups_callback()`

#### 0.5.4 (2017-12-25)
* (AlCalzone) Update `node-coap-client` dependency to support receiving block-wise messages.

#### 0.5.3 (2017-12-01)
* (AlCalzone) Allow calling `setColor()` for white spectrum bulbs with `f5faf6`, `f1e0b5` and `efd275`

#### 0.5.1 (2017-12-01)
* (AlCalzone) Fixed a bug where the simplified light API would not always send the correct payloads.

#### 0.5.0 (2017-11-20)
* (AlCalzone) Fixed some checks in the simplified API for lights
* (AlCalzone) The promises returned by `observeDevices` and `observeGroupsAndScenes` now only resolve after all devices or groups and scenes have been received

#### 0.4.1 (2017-11-07)
* (AlCalzone) Simplified operating groups

#### 0.4.0 (2017-11-04)
* (AlCalzone) Reworked the observe api so it resides on TradfriClient now
* (AlCalzone) Simplified operating lights

#### 0.3.0 (2017-11-02)
* (AlCalzone) Changed authentication procedure to comply with IKEA's request
* (AlCalzone) Round brightness up, so that 1 => 1%, not 0%

#### 0.2.0
* (AlCalzone) first working release


## License
The MIT License (MIT)

Copyright (c) 2017 AlCalzone <d.griesel@gmx.net>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
