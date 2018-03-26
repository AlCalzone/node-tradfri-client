import { DeviceInfo } from "./deviceInfo";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, doNotSerialize, ipsoKey, required, serializeWith } from "./ipsoObject";
import { Light } from "./light";
import { log } from "./logger";
import { OperationProvider } from "./operation-provider";
import { Plug } from "./plug";
import { Sensor } from "./sensor";

// list of known endpoints defined on the gateway
export enum AccessoryTypes {
	remote = 0,
	lightbulb = 2,
	motionSensor = 4,
	// TODO: find out the other ones
}

export class Accessory extends IPSODevice {

	@ipsoKey("5750")
	public type: AccessoryTypes = AccessoryTypes.remote;

	@ipsoKey("3")
	@deserializeWith((obj, me) => new DeviceInfo(me.options).parse(obj))
	public deviceInfo: DeviceInfo;

	@ipsoKey("9019")
	public alive: boolean = false;

	@ipsoKey("9020")
	public lastSeen: number = 0;

	@ipsoKey("3311")
	@deserializeWith((obj, me: Accessory) => new Light(me.options, me).parse(obj))
	public lightList: Light[];

	@ipsoKey("3312")
	@deserializeWith((obj, me) => new Plug(me.options).parse(obj))
	public plugList: Plug[];

	@ipsoKey("3300")
	@deserializeWith((obj, me) => new Sensor(me.options).parse(obj))
	public sensorList: Sensor[];

	@ipsoKey("15009")
	@deserializeWith((obj, me) => new IPSODevice(me.options).parse(obj))
	public switchList: IPSODevice[]; // <[Switch]> // seems unsupported atm.

	@ipsoKey("9054")
	public otaUpdateState: number = 0; // boolean?

	/**
	 * Remember if this is a light but incorrectly announced as a remote
	 * Fixes this firmware bug: GH#67
	 * @internal
	 */
	@doNotSerialize
	private isLightAnnouncedAsRemote: boolean = false;

	public clone(): this {
		const ret = super.clone() as this;
		ret.isLightAnnouncedAsRemote = this.isLightAnnouncedAsRemote;
		return ret;
	}

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
		return this;
	}

	/**
	 * Fixes property values that are known to be bugged
	 */
	public fixBuggedProperties(): this {
		log(`Accessory: fixing bugged properties`, "silly");
		super.fixBuggedProperties();

		// Fix GH#67
		if (
			this.type !== AccessoryTypes.lightbulb &&
			this.deviceInfo != null &&
			Light.shouldBeALight(this.deviceInfo.modelNumber) &&
			(this.lightList == null || this.lightList.length === 0) &&
			(this.switchList != null && this.switchList.length !== null)
		) {
			this.isLightAnnouncedAsRemote = true;
			this.type = AccessoryTypes.lightbulb;
			this.lightList = this.switchList.map(
				swtch => new Light(this.options, this).parse(swtch.originalPayload),
			);
			this.switchList = null;
		}

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
		return this;
	}

	public restoreBuggedProperties(): this {
		log(`Accessory: restoring bugged properties`, "silly");

		if (this.lightList != null) {
			this.lightList = this.lightList.map(light => light.restoreBuggedProperties());
		}
		/* istanbul ignore next */
		if (this.plugList != null) {
			this.plugList = this.plugList.map(plug => plug.restoreBuggedProperties());
		}
		/* istanbul ignore next */
		if (this.sensorList != null) {
			this.sensorList = this.sensorList.map(sensor => sensor.restoreBuggedProperties());
		}
		/* istanbul ignore next */
		if (this.switchList != null) {
			this.switchList = this.switchList.map(swtch => swtch.restoreBuggedProperties());
		}

		// Fix GH#67
		if (this.isLightAnnouncedAsRemote) {
			this.type = AccessoryTypes.remote;
			this.switchList = this.lightList; // we want to serialize lights!
			this.lightList = undefined;
			this.isLightAnnouncedAsRemote = false; // we just reverted it
		}

		super.restoreBuggedProperties();
		return this;
	}

}
