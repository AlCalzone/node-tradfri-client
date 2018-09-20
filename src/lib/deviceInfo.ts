import { ipsoKey, IPSOObject } from "./ipsoObject";

export enum PowerSources {
	Unknown = 0,
	InternalBattery = 1,
	ExternalBattery = 2,
	Battery = 3, // apparently used by the remote (not in spec)
	PowerOverEthernet = 4,
	USB = 5,
	AC_Power = 6,
	Solar = 7,
}

// contains information about a specific device
export class DeviceInfo extends IPSOObject {

	@ipsoKey("9")
	public battery: number; // no default value, some devices don't have a battery

	@ipsoKey("3")
	public firmwareVersion: string = "";

	@ipsoKey("0")
	public manufacturer: string = "";

	@ipsoKey("1")
	public modelNumber: string = "";

	@ipsoKey("6")
	public power: PowerSources = PowerSources.Unknown;

	@ipsoKey("2")
	public serialNumber: string = "";

}
