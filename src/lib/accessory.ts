// wotan-disable no-useless-predicate
// Until I'm sure that the properties may be nullable, we have to allow these "useless" checks

import { Blind } from "./blind";
import { DeviceInfo } from "./deviceInfo";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, ipsoKey } from "./ipsoObject";
import { Light } from "./light";
import { OperationProvider } from "./operation-provider";
import { Plug } from "./plug";
import { Sensor } from "./sensor";

// list of known endpoints defined on the gateway
export enum AccessoryTypes {
	/** A "normal" remote */
	remote = 0,
	/**
	 * A remote which has been paired with another remote.
	 * See https://www.reddit.com/r/tradfri/comments/6x1miq for details
	 */
	slaveRemote = 1,
	/** A lightbulb */
	lightbulb = 2,
	/** A smart plug */
	plug = 3,
	/** A motion sensor (currently unsupported) */
	motionSensor = 4,
	/** A smart blind */
	blind = 5, // TODO: This is a guess. Double-check when the blinds are out
}

export class Accessory extends IPSODevice {

	// All properties only exist after the light has been received from the gateway
	// so they are definitely assigned!

	@ipsoKey("5750")
	public type: AccessoryTypes = AccessoryTypes.remote;

	@ipsoKey("3")
	@deserializeWith((obj, me: Accessory) => new DeviceInfo(me.options).parse(obj))
	public deviceInfo!: DeviceInfo;

	@ipsoKey("9019")
	public alive: boolean = false;

	@ipsoKey("9020")
	public lastSeen: number = 0;

	@ipsoKey("3311")
	@deserializeWith((obj, me: Accessory) => new Light(me.options, me).parse(obj))
	public lightList!: Light[];

	@ipsoKey("3312")
	@deserializeWith((obj, me: Accessory) => new Plug(me.options, me).parse(obj))
	public plugList!: Plug[];

	// Don't test sensors for now, they are unsupported
	@ipsoKey("3300")
	@deserializeWith(/* istanbul ignore next */ (obj, me: Accessory) => new Sensor(me.options).parse(obj))
	public sensorList!: Sensor[];

	// Don't test switches for now, they are unsupported
	@ipsoKey("15009")
	@deserializeWith(/* istanbul ignore next */ (obj, me: Accessory) => new IPSODevice(me.options).parse(obj))
	public switchList!: IPSODevice[]; // <[Switch]> // seems unsupported atm.

	@ipsoKey("15015")
	@deserializeWith((obj, me: Accessory) => new Blind(me.options, me).parse(obj))
	public blindList!: Blind[];

	@ipsoKey("9054")
	public otaUpdateState: number = 0; // boolean?

	// TODO: This property is reported by the gateway, but not in
	// the IKEA app as of version 1.7.0
	// It seems to be some kind of hash, find out what it does
	// e.g. "9084":" 6c ba 7f 97 47 8e 75 88 10 20 29 30 60 a9 3b 7d"
	/** @internal */
	@ipsoKey("9084")
	public UNKNOWN1!: string;

	/**
	 * Link this object to a TradfriClient for a simplified API.
	 * @param client The client instance to link this object to
	 * @internal
	 */
	public link(client: OperationProvider): this {
		super.link(client);
		if (this.lightList != null) {
			for (const light of this.lightList) {
				light.link(client);
			}
		}
		/* istanbul ignore next */
		if (this.plugList != null) {
			for (const plug of this.plugList) {
				plug.link(client);
			}
		}
		/* istanbul ignore next */
		if (this.sensorList != null) {
			for (const sensor of this.sensorList) {
				sensor.link(client);
			}
		}
		/* istanbul ignore next */
		if (this.switchList != null) {
			for (const swtch of this.switchList) {
				swtch.link(client);
			}
		}
		/* istanbul ignore next */
		if (this.blindList != null) {
			for (const blind of this.blindList) {
				blind.link(client);
			}
		}
		return this;
	}

	/**
	 * Fixes property values that are known to be bugged
	 */
	public fixBuggedProperties(): this {
		super.fixBuggedProperties();
		if (this.lightList != null) {
			this.lightList = this.lightList.map(light => light.fixBuggedProperties());
		}
		/* istanbul ignore next */
		if (this.plugList != null) {
			this.plugList = this.plugList.map(plug => plug.fixBuggedProperties());
		}
		/* istanbul ignore next */
		if (this.sensorList != null) {
			this.sensorList = this.sensorList.map(sensor => sensor.fixBuggedProperties());
		}
		/* istanbul ignore next */
		if (this.switchList != null) {
			this.switchList = this.switchList.map(swtch => swtch.fixBuggedProperties());
		}
		/* istanbul ignore next */
		if (this.blindList != null) {
			this.blindList = this.blindList.map(blind => blind.fixBuggedProperties());
		}
		return this;
	}

}
