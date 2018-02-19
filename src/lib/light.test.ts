// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

import { expect } from "chai";
import { Accessory } from "./accessory";
import { Spectrum } from "./light";
import { MAX_COLOR, predefinedColors } from "./predefined-colors";

function buildAccessory(modelName: string) {
	return {
		3: {
			0: "IKEA of Sweden",
			1: modelName,
			2: "",
			3: "1.2.217",
			6: 1,
		},
		3311: [
			{
				5706: "010203",
				5707: 38079,
				5708: 43737,
				5709: 0,
				5710: 0,
				5711: 0,
				5850: 1,
				5851: 254,
				9003: 0,
			},
		],
		5750: 2,
		9001: modelName,
		9002: 1499440525,
		9003: 65538,
		9019: 1,
		9020: 1507456927,
		9054: 0,
	};
}

describe("ipso/light => feature tests =>", () => {

	// setup feature table
	interface Device {
		name: string;
		isDimmable: boolean;
		isSwitchable: boolean;
		spectrum: Spectrum;
	}
	const deviceTable = new Map<string, Device>();
	function add(name: string, switchable: boolean, dimmable: boolean, spectrum: Spectrum) {
		deviceTable.set(name, { name, isDimmable: dimmable, isSwitchable: switchable, spectrum });
	}

	// white spectrum lamps
	add("TRADFRI bulb E27 WS clear 950lm", true, true, "white");
	add("TRADFRI bulb E27 WS opal 950lm", true, true, "white");
	add("TRADFRI bulb E14 WS opal 400lm", true, true, "white");
	add("TRADFRI bulb E12 WS opal 400lm", true, true, "white");
	add("TRADFRI bulb E26 WS clear 950lm", true, true, "white");
	add("TRADFRI bulb E26 WS opal 980lm", true, true, "white");
	add("TRADFRI bulb E27 WS opal 980lm", true, true, "white");

	// single-colored lamps
	add("TRADFRI bulb E26 opal 1000lm", true, true, "none");
	add("TRADFRI bulb E27 opal 1000lm", true, true, "none");
	add("TRADFRI bulb E26 W opal 1000lm", true, true, "none");
	add("TRADFRI bulb E27 W opal 1000lm", true, true, "none");
	add("TRADFRI bulb E14 W op/ch 400lm", true, true, "none");
	add("TRADFRI bulb E12 W op/ch 400lm", true, true, "none");

	// rgb lamps
	add("TRADFRI bulb E27 C/WS opal 600lm", true, true, "rgb");
	add("TRADFRI bulb E14 C/WS opal 600lm", true, true, "rgb");
	add("TRADFRI bulb E27 C/WS opal 600", true, true, "rgb");
	add("TRADFRI bulb E27 CWS opal 600", true, true, "rgb");
	add("TRADFRI bulb E26 CWS opal 600", true, true, "rgb");
	add("TRADFRI bulb E14 CWS opal 600", true, true, "rgb");
	add("TRADFRI bulb E12 CWS opal 600", true, true, "rgb");

	it("supported features should be detected correctly", () => {
		for (const device of deviceTable.values()) {
			const acc = new Accessory().parse(buildAccessory(device.name));
			const light = acc.lightList[0];

			expect(light.isSwitchable).to.equal(device.isSwitchable, `${device.name} should ${device.isSwitchable ? "" : "not "}be switchable`);
			expect(light.isDimmable).to.equal(device.isDimmable, `${device.name} should ${device.isDimmable ? "" : "not "}be dimmable`);
			expect(light.spectrum).to.equal(device.spectrum, `${device.name} should have spectrum ${device.spectrum}`);
		}
	});

	it("setting the hex color on an RGB bulb should update hue and saturation", () => {
		const rgb = new Accessory()
			.parse(buildAccessory("TRADFRI bulb E27 C/WS opal 600lm"))
			.createProxy()
			;
		const light = rgb.lightList[0];

		light.merge({hue: 0, saturation: 0});
		light.color = "BADA55";
		expect(light.hue).to.not.equal(0);
		expect(light.saturation).to.not.equal(0);
	});

	it("the payload to set RGB color should include hue/saturation and transitionTime", () => {
		const rgb = new Accessory()
			.parse(buildAccessory("TRADFRI bulb E27 C/WS opal 600lm"))
			.createProxy()
			;
		const original = rgb.clone();
		const light = rgb.lightList[0];

		light.color = "BADA55";
		const serialized = rgb.serialize(original);
		expect(serialized).to.haveOwnProperty("3311");
		expect(serialized["3311"]).to.have.length(1);
		expect(serialized["3311"][0]).to.haveOwnProperty("5707");
		expect(serialized["3311"][0]).to.haveOwnProperty("5708");
		expect(serialized["3311"][0]).to.haveOwnProperty("5712");
	});

	it("updating RGB to a predefined color should send the predefined hue/saturation values", () => {
		const rgb = new Accessory()
			.parse(buildAccessory("TRADFRI bulb E27 C/WS opal 600lm"))
			.createProxy()
			;
		const original = rgb.clone();
		const light = rgb.lightList[0];

		for (const predefined of predefinedColors.values()) {
			if (predefined.rgbHex === original.lightList[0].color) continue;
			light.color = predefined.rgbHex;
			const serialized = rgb.serialize(original);
			expect(serialized).to.deep.equal({
				3311: [{
					5707: Math.round(predefined.hue / 360 * MAX_COLOR),
					5708: Math.round(predefined.saturation / 100 * MAX_COLOR),
					5712: 5,
				}],
			});
		}
	});

	it("when updating hue, saturation should be sent as well", () => {
		const rgb = new Accessory()
			.parse(buildAccessory("TRADFRI bulb E27 C/WS opal 600lm"))
			.createProxy()
			;
		const original = rgb.clone();
		const light = rgb.lightList[0];

		light.hue = 123;

		const serialized = rgb.serialize(original);
		expect(serialized).to.haveOwnProperty("3311");
		expect(serialized["3311"]).to.have.length(1);
		expect(serialized["3311"][0]).to.haveOwnProperty("5707");
		expect(serialized["3311"][0]).to.haveOwnProperty("5708");
	});

	it("when updating saturation, hue should be sent as well", () => {
		const rgb = new Accessory()
			.parse(buildAccessory("TRADFRI bulb E27 C/WS opal 600lm"))
			.createProxy()
			;
		const original = rgb.clone();
		const light = rgb.lightList[0];

		light.saturation = 67.8;

		const serialized = rgb.serialize(original);
		expect(serialized).to.haveOwnProperty("3311");
		expect(serialized["3311"]).to.have.length(1);
		expect(serialized["3311"][0]).to.haveOwnProperty("5707");
		expect(serialized["3311"][0]).to.haveOwnProperty("5708");
	});

	it("parsing an RGB light should result in a valid hex color", () => {
		const source = buildAccessory("TRADFRI bulb E27 C/WS opal 600lm");
		delete source["3311"][0]["5706"];
		source["3311"][0]["5709"] = 24567;
		source["3311"][0]["5710"] = 30987;
		const rgb = new Accessory()
			.parse(source)
			.createProxy()
			;
		expect(/^[a-fA-F0-9]{6}$/.test(rgb.lightList[0].color));
	});

	it("parsing an RGB light without any color properties should result in a valid hex color", () => {
		const source = buildAccessory("TRADFRI bulb E27 C/WS opal 600lm");
		delete source["3311"][0]["5706"];
		delete source["3311"][0]["5709"];
		delete source["3311"][0]["5710"];
		const rgb = new Accessory()
			.parse(source)
			.createProxy()
			;
		expect(/^[a-fA-F0-9]{6}$/.test(rgb.lightList[0].color));
	});

	it("floating point values should be supported", () => {
		const source = buildAccessory("TRADFRI bulb E27 C/WS opal 600lm");
		source["3311"][0]["5851"] = 179;
		const rgb = new Accessory()
			.parse(source)
			.createProxy()
			;
		expect(rgb.lightList[0].dimmer).to.equal(70.5);
	});

});
