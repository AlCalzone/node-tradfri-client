// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

import { expect } from "chai";
import { Accessory } from "./accessory";
import { Spectrum } from "./light";
import { predefinedColors } from "./predefined-colors";

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
				5706: "f5faf6",
				5707: 0,
				5708: 0,
				5709: 24930,
				5710: 24694,
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

	it("setting the hex color on an RGB bulb should update colorX and colorY", () => {
		const rgb = new Accessory()
			.parse(buildAccessory("TRADFRI bulb E27 C/WS opal 600lm"))
			.createProxy()
			;
		const light = rgb.lightList[0];

		light.merge({colorX: 0, colorY: 0});
		light.color = "BADA55";
		expect(light.colorX).to.not.equal(0);
		expect(light.colorY).to.not.equal(0);
	});

	it("the payload to set RGB color should include colorX/Y and transitionTime", () => {
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
		expect(serialized["3311"][0]).to.haveOwnProperty("5709");
		expect(serialized["3311"][0]).to.haveOwnProperty("5710");
		expect(serialized["3311"][0]).to.haveOwnProperty("5712");
	});

	it("updating RGB to a predefined color should send the predefined colorX/Y values", () => {
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
					5709: predefined.colorX,
					5710: predefined.colorY,
					5712: 5,
				}],
			});
		}

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

});
