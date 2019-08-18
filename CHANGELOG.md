# Changelog

## __WORK IN PROGRESS__
* (AlCalzone) Add experimental support for blinds. This is expected to be buggy since I had to guess a couple of times.

## 1.5.0 (2018-11-12)
* (AlCalzone) Bundle declaration files before publishing on npm
* (AlCalzone) Update `shared-utils` dependency to fix compile errors

## 1.4.3 (2018-11-04)
* (AlCalzone) Rework installation procedure. `node-aead-crypto` is now optional.

## 1.4.2 (2018-11-04)
* (jareware) Add enum member for slave remotes (remotes that have been paired with other remotes)

## 1.4.1 (2018-10-29)
* (AlCalzone) Add `setBrightness` method to plugs for better compatibility with lights.

## 1.4.0 (2018-10-27)
* (AlCalzone & rogierhofboer) Experimental support for smart plugs

## 1.3.4 (2018-09-08)
* (AlCalzone) Fix gateway discovery on Mac OSX over WiFi

## 1.3.2 (2018-08-01)
* (AlCalzone) Retry the initial connection when it fails with an "unexpected error"

## 1.3.1 (2018-07-30)
* (AlCalzone) Improve gateway discovery in networks with IPv4 and IPv6

## 1.3.0 (2018-07-30)
* (AlCalzone) `TradfriErrors` with code `ConnectionFailed` now contain more information about the original error.

## 1.2.1 (2018-05-14)
* (AlCalzone) Stop logging `parsing payload...`

## 1.2.0 (2018-05-05)
* (neophob) Include the hostname in the discovery response if present.
* (AlCalzone) Support programmatically rebooting and resetting the gateway.
* (AlCalzone) Add support for notifications.

## 1.1.2 (2018-05-01)
* (AlCalzone) Update CoAP and DTLS libraries so `node-aead-crypto` is no longer necessary on NodeJS 10+

## 1.0.1 (2018-04-27)
* (AlCalzone) Add support for NodeJS 10

## 1.0.0 (2018-04-19)
* (AlCalzone) Added tests for groups and scenes and fixed minor found bugs

## 0.13.0 (2018-04-17)
* (rogierhofboer) Detect lightbulb spectrum depending on its capabilities instead of the model name.

## 0.12.2 (2018-03-18)
* (AlCalzone) Automatic reconnection now restores observers

## 0.12.1 (2018-03-18)
* (AlCalzone) Added automatic retrying of the initial connection (if already authenticated)

## 0.12.0 (2018-03-17)
* (AlCalzone) Fix rounding and hue/saturation when using raw CoAP values
* (AlCalzone) Experimental support for automatic connection watching and reconnection

## 0.11.0 (2018-03-15) - WARNING: BREAKING CHANGES!
* (AlCalzone) **BREAKING**: The `connect()` method now either resolves with `true` or rejects with an error detailing why the connection failed.
* (AlCalzone) The error thrown by `authentication()` now correctly reflects why the authentication failed.
* (AlCalzone) Swallow `"DTLS handshake timed out"` promise rejections and emit an `"error"` instead

## 0.10.1 (2018-03-15)
* (AlCalzone) Ensure all changes are being sent when using the simplified API for groups.

## 0.10.0 (2018-03-15)
* (AlCalzone) Swallow `"CoapClient was reset"` promise rejections and emit an `"error"` instead
* (AlCalzone) Avoid sending `5712: null` in payloads when a group's transition time is `null` for some reason

## 0.9.1 (2018-03-09)
* (AlCalzone) Fix properties which are wrongly reported by the gateway

## 0.9.0 (2018-03-09)
* (neophob) Added gateway discovery
* (AlCalzone) Added timeout and tests for gateway discovery

## 0.8.7 (2018-03-08)
* (AlCalzone) Greatly enhanced test coverage
* (AlCalzone) Fixed some minor issues found by the new tests

## 0.8.6 (2018-03-07)
* (AlCalzone) Published bugfixes that should have been live already.

## 0.8.5 (2018-02-27)
* (AlCalzone) Updated `node-coap-client`

## 0.8.4 (2018-02-23)
* (AlCalzone) Fixed `Group.activateScene` when the scene was already selected

## 0.8.3 (2018-02-22)
* (AlCalzone) Removed the recently-added payload merging because it did more harm than good
* (AlCalzone) Fixed `Group.activateScene` when the lights are turned off

## 0.8.2 (2018-02-19)
* (AlCalzone) Force `hue` and `saturation` to appear in pairs in the sent payload

## 0.8.1 (2018-02-15)
* (AlCalzone) Support floating point numbers as property values

## 0.8.0 (2018-02-15)
* (AlCalzone) Use the `hue` and `saturation` CoAP properties directly instead of `colorX/Y`

## 0.7.2 (2018-02-07)
* (AlCalzone) Attempt to fix `TypeError: generator already running` in ioBroker.tradfri

## 0.7.1 (2018-02-06)
* (AlCalzone) Update coap/dtls libs: Fixed an error in the cipher suite definitions

## 0.7.0 (2018-01-28)
* (AlCalzone) Support using raw CoAP values instead of the simplified scales for many properties.

## 0.6.0 (2018-01-13)
* (AlCalzone) Use the `colorTemperature` CoAP property directly instead of `colorX/Y`

## 0.5.6 (2018-01-10)
* (AlCalzone) Added stub property for IPSO key `5717` in Light objects to remove warnings for Gateway v1.3.14

## 0.5.5 (2017-12-25)
* (AlCalzone) Fixed a null reference in `observeGroups_callback()`

## 0.5.4 (2017-12-25)
* (AlCalzone) Update `node-coap-client` dependency to support receiving block-wise messages.

## 0.5.3 (2017-12-01)
* (AlCalzone) Allow calling `setColor()` for white spectrum bulbs with `f5faf6`, `f1e0b5` and `efd275`

## 0.5.1 (2017-12-01)
* (AlCalzone) Fixed a bug where the simplified light API would not always send the correct payloads.

## 0.5.0 (2017-11-20)
* (AlCalzone) Fixed some checks in the simplified API for lights
* (AlCalzone) The promises returned by `observeDevices` and `observeGroupsAndScenes` now only resolve after all devices or groups and scenes have been received

## 0.4.1 (2017-11-07)
* (AlCalzone) Simplified operating groups

## 0.4.0 (2017-11-04)
* (AlCalzone) Reworked the observe api so it resides on TradfriClient now
* (AlCalzone) Simplified operating lights

## 0.3.0 (2017-11-02)
* (AlCalzone) Changed authentication procedure to comply with IKEA's request
* (AlCalzone) Round brightness up, so that 1 => 1%, not 0%

## 0.2.0
* (AlCalzone) first working release

