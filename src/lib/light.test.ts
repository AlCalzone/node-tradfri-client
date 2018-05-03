// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

// tslint:disable:no-unused-expression

import { assert, expect, should, use } from "chai";
import { spy, stub } from "sinon";

import { TradfriClient } from "..";
import { createNetworkMock } from "../../test/mocks";
import { Accessory } from "./accessory";
import { IPSOObject } from "./ipsoObject";
import { Light, LightOperation, Spectrum } from "./light";
import { entries } from "./object-polyfill";
import { MAX_COLOR, predefinedColors, whiteSpectrumHex } from "./predefined-colors";

// enable the should interface with sinon
should();

function buildAccessory(modelName: string, spectrum: Spectrum) {
	const attributes = {
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
				5709: 0,
				5710: 0,
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

	switch (spectrum) {
		case "rgb": {
			attributes["3311"][0]["5707"] = 38079;
			attributes["3311"][0]["5708"] = 43737;
			attributes["3311"][0]["5711"] = 0;
			break;
		}
		case "white": {
			attributes["3311"][0]["5711"] = 0;
			break;
		}
	}
	return attributes;

}

function assertPayload(actual: any, expected: {}, message?: string) {
	expect(actual).to.be.an.instanceof(Buffer, "the payload was no Buffer");
	expect(JSON.parse(actual.toString())).to.deep.equal(expected, message);
}

describe("ipso/light => basic functionality =>", () => {

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
			const acc = new Accessory().parse(buildAccessory(device.name, device.spectrum));
			const light = acc.lightList[0];

			expect(light.isSwitchable).to.equal(device.isSwitchable, `${device.name} should ${device.isSwitchable ? "" : "not "}be switchable`);
			expect(light.isDimmable).to.equal(device.isDimmable, `${device.name} should ${device.isDimmable ? "" : "not "}be dimmable`);
			expect(light.spectrum).to.equal(device.spectrum, `${device.name} should have spectrum ${device.spectrum}`);
		}
	});

	it("setting the hex color on an RGB bulb should update hue and saturation", () => {
		const rgb = new Accessory()
			.parse(buildAccessory("TRADFRI bulb E27 C/WS opal 600lm", "rgb"))
			.createProxy()
			;
		const light = rgb.lightList[0];

		light.merge({ hue: 0, saturation: 0 });
		light.color = "BADA55";
		expect(light.hue).to.not.equal(0);
		expect(light.saturation).to.not.equal(0);
	});

	it("the payload to set RGB color should include hue/saturation and transitionTime", () => {
		const rgb = new Accessory()
			.parse(buildAccessory("TRADFRI bulb E27 C/WS opal 600lm", "rgb"))
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

	describe("updating RGB to a predefined color should send the predefined hue/saturation values", () => {
		it("with the simplified scale", () => {
			const rgb = new Accessory()
				.parse(buildAccessory("TRADFRI bulb E27 C/WS opal 600lm", "rgb"))
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
		it("with raw CoAP values", () => {
			const rgb = new Accessory({ skipValueSerializers: true })
				.parse(buildAccessory("TRADFRI bulb E27 C/WS opal 600lm", "rgb"))
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
						5707: predefined.hue_raw,
						5708: predefined.saturation_raw,
						5712: 5,
					}],
				});
			}
		});
	});

	it("when updating hue, saturation should be sent as well", () => {
		const rgb = new Accessory()
			.parse(buildAccessory("TRADFRI bulb E27 C/WS opal 600lm", "rgb"))
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
			.parse(buildAccessory("TRADFRI bulb E27 C/WS opal 600lm", "rgb"))
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
		const source = buildAccessory("TRADFRI bulb E27 C/WS opal 600lm", "rgb");
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
		const source = buildAccessory("TRADFRI bulb E27 C/WS opal 600lm", "rgb");
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
		const source = buildAccessory("TRADFRI bulb E27 C/WS opal 600lm", "rgb");
		source["3311"][0]["5851"] = 179;
		const rgb = new Accessory()
			.parse(source)
			.createProxy()
			;
		expect(rgb.lightList[0].dimmer).to.equal(70.5);
	});

	describe("values should be rounded in raw CoAP mode => ", () => {

		type TestSet = {
			[prop in keyof Light]?: { key: number, min: number, max: number, rgb: boolean };
		};
		const tests: TestSet = {
			dimmer: { key: 5851, min: 0, max: 254, rgb: false },
			colorTemperature: { key: 5711, min: 250, max: 454, rgb: false },
			hue: { key: 5707, min: 0, max: MAX_COLOR, rgb: true },
			saturation: { key: 5708, min: 0, max: MAX_COLOR, rgb: true },
		};

		for (const [prop, test] of entries(tests)) {
			const source = buildAccessory(test.rgb ? "TRADFRI bulb E12 CWS opal 600" : "TRADFRI bulb E27 C/WS opal 600lm", "rgb");
			const acc = new Accessory({ skipValueSerializers: true })
				.parse(source)
				.createProxy()
				;
			it(`for the ${prop} property`, () => {
				const changed = acc.clone();
				// TODO: enable this test at a later stage
				// // < min
				// changed.lightList[0][prop] = test.min - 1;
				// expect(changed.serialize()[3311][0][test.key]).to.equal(test.min, `min wasn't clamped for ${prop}`);
				// // > max
				// changed.lightList[0][prop] = test.max + 1;
				// expect(changed.serialize()[3311][0][test.key]).to.equal(test.max, `max wasn't clamped for ${prop}`);
				// float
				let float = (test.min + test.max) / 2;
				if (float % 1 === 0) float += 0.67;
				changed.lightList[0][prop] = float;
				expect(changed.serialize()[3311][0][test.key]).to.equal(Math.round(float), `float wasn't rounded for ${prop}`);
			});
		}

	});

	it("cloning a light should correctly copy the model name", () => {
		const source = buildAccessory("TRADFRI bulb E27 C/WS opal 600lm", "rgb");
		const acc = new Accessory().parse(source);
		const light = acc.lightList[0];
		const clone = light.clone();
		// the model name is internally responsible for detecting the spectrum
		// so we use that to test
		expect(light.spectrum).to.equal(clone.spectrum);
	});

});

describe("ipso/light => simplified API => ", () => {

	// Setup a fresh mock
	const {
		tradfri,
		devicesUrl,
		fakeCoap,
		callbacks,
		createStubs,
		restoreStubs,
		resetStubHistory,
	} = createNetworkMock();
	before(createStubs);
	after(restoreStubs);
	afterEach(resetStubHistory);

	const apiMethods = [
		"turnOn", "turnOff", "toggle",
		"setBrightness", "setColor",
		"setColorTemperature", "setHue", "setSaturation",
	];

	describe("all methods should fail when no client instance has been linked", () => {
		// Create a new light without a linked client instance
		const unlinked = new Light();
		for (const method of apiMethods) {
			it(method, () => {
				expect(unlinked[method].bind(unlinked)).to.throw("linked to a client");
			});
		}
	});

	describe("all methods should fail when no accessory instance has been linked", () => {
		// Create a new light without a linked accessory instance
		const linked = new Light();
		linked.link(tradfri);

		for (const method of apiMethods) {
			it(method, () => {
				expect(linked[method].bind(linked)).to.throw("linked to an Accessory");
			});
		}
	});

	const accNoSpectrum = new Accessory().parse(
		buildAccessory("TRADFRI bulb E26 opal 1000lm", "none"),
	).link(tradfri);
	const lightNoSpectrum = accNoSpectrum.lightList[0];
	const accWhiteSpectrum = new Accessory().parse(
		buildAccessory("TRADFRI bulb E27 WS clear 950lm", "white"),
	).link(tradfri);
	const lightWhiteSpectrum = accWhiteSpectrum.lightList[0];
	const accRGBSpectrum = new Accessory().parse(
		buildAccessory("TRADFRI bulb E27 C/WS opal 600lm", "rgb"),
	).link(tradfri);
	const lightRGBSpectrum = accRGBSpectrum.lightList[0];
	const allLights = [
		lightNoSpectrum, lightWhiteSpectrum, lightRGBSpectrum,
	];

	describe("the methods should send the correct payload (all spectrums) =>", () => {

		it("turnOn() when the lights are off", async () => {
			for (let i = 0, light = allLights[i]; i < allLights.length; i++) {
				light.onOff = false;
				await light.turnOn().should.become(true);
				assertPayload(fakeCoap.request.getCall(i).args[2], {
					3311: [{
						5850: 1,
						5712: 5,
					}],
				});
			}
		});

		it("turnOn() when the lights are on", async () => {
			for (let i = 0, light = allLights[i]; i < allLights.length; i++) {
				light.onOff = true;
				await light.turnOn().should.become(false);
			}
			fakeCoap.request.should.not.have.been.called;
		});

		it("turnOff() when the lights are on", async () => {
			for (let i = 0, light = allLights[i]; i < allLights.length; i++) {
				light.onOff = true;
				await light.turnOff().should.become(true);
				assertPayload(fakeCoap.request.getCall(i).args[2], {
					3311: [{
						5850: 0,
						5712: 5,
					}],
				});
			}
		});

		it("turnOff() when the lights are off", async () => {
			for (let i = 0, light = allLights[i]; i < allLights.length; i++) {
				light.onOff = false;
				await light.turnOff().should.become(false);
			}
			fakeCoap.request.should.not.have.been.called;
		});

		it("toggle(true) when the lights are off", async () => {
			for (let i = 0, light = allLights[i]; i < allLights.length; i++) {
				light.onOff = false;
				await light.toggle(true).should.become(true);
				assertPayload(fakeCoap.request.getCall(i).args[2], {
					3311: [{
						5850: 1,
						5712: 5,
					}],
				});
			}
		});

		it("toggle(true) when the lights are on", async () => {
			for (let i = 0, light = allLights[i]; i < allLights.length; i++) {
				light.onOff = true;
				await light.toggle(true).should.become(false);
			}
			fakeCoap.request.should.not.have.been.called;
		});

		it("toggle(false) when the lights are on", async () => {
			for (let i = 0, light = allLights[i]; i < allLights.length; i++) {
				light.onOff = true;
				await light.toggle(false).should.become(true);
				assertPayload(fakeCoap.request.getCall(i).args[2], {
					3311: [{
						5850: 0,
						5712: 5,
					}],
				});
			}
		});

		it("toggle(false) when the lights are off", async () => {
			for (let i = 0, light = allLights[i]; i < allLights.length; i++) {
				light.onOff = false;
				await light.toggle(false).should.become(false);
			}
			fakeCoap.request.should.not.have.been.called;
		});

		it("toggle() when the lights are off", async () => {
			for (let i = 0, light = allLights[i]; i < allLights.length; i++) {
				light.onOff = false;
				await light.toggle().should.become(true);
				assertPayload(fakeCoap.request.getCall(i).args[2], {
					3311: [{
						5850: 1,
						5712: 5,
					}],
				});
			}
		});

		it("toggle() when the lights are on", async () => {
			for (let i = 0, light = allLights[i]; i < allLights.length; i++) {
				light.onOff = true;
				await light.toggle().should.become(true);
				assertPayload(fakeCoap.request.getCall(i).args[2], {
					3311: [{
						5850: 0,
						5712: 5,
					}],
				});
			}
		});

		it("setBrightness() without transition time", async () => {
			for (let i = 0, light = allLights[i]; i < allLights.length; i++) {
				light.dimmer = 0;
				await light.setBrightness(100).should.become(true);
				assertPayload(fakeCoap.request.getCall(i).args[2], {
					3311: [{
						5851: 254,
						5712: 5,
					}],
				});
			}
		});

		it("setBrightness() with transition time", async () => {
			for (let i = 0, light = allLights[i]; i < allLights.length; i++) {
				light.dimmer = 0;
				await light.setBrightness(100, 2).should.become(true);
				assertPayload(fakeCoap.request.getCall(i).args[2], {
					3311: [{
						5851: 254,
						5712: 20,
					}],
				});
			}
		});

	});

	describe("the methods should send the correct payload (RGB) =>", () => {

		it("setColor() should throw for no-spectrum bulbs", async () => {
			expect(() => lightNoSpectrum.setColor("abcdef")).to.throw("RGB lightbulbs");
		});

		it("setColor() should only accept predefined values for white spectrum bulbs", async () => {
			expect(() => lightWhiteSpectrum.setColor("abcdef")).to.throw("support the following colors");
			expect(() => lightWhiteSpectrum.setColor("f5faf6")).not.to.throw;
			expect(() => lightWhiteSpectrum.setColor("f1e0b5")).not.to.throw;
			expect(() => lightWhiteSpectrum.setColor("efd275")).not.to.throw;
		});

		it("setColor() for a white spectrum bulb should send the correct payload", async () => {
			const keys = Object.keys(whiteSpectrumHex);

			for (let i = 0, hex = keys[i]; i < keys.length; i++) {
				lightWhiteSpectrum.colorTemperature = 1;
				const expected = predefinedColors.get(hex).temperature;

				await lightWhiteSpectrum.setColor(hex).should.become(true);
				assertPayload(fakeCoap.request.getCall(i).args[2], {
					3311: [{
						5711: expected,
						5712: 5,
					}],
				}, `color temperature for "${hex}" did not equal ${expected}`);
			}
		});

		it("setColor() without transition time", async () => {
			await lightRGBSpectrum.setColor("FF0000").should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3311: [{
					5707: 0,
					5708: 65279,
					5712: 5,
				}],
			});
		});

		it("setColor() with transition time", async () => {
			await lightRGBSpectrum.setColor("FF0000", 2).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3311: [{
					5707: 0,
					5708: 65279,
					5712: 20,
				}],
			});
		});

		it("setHue() should throw for non-RGB bulbs", async () => {
			expect(() => lightNoSpectrum.setHue(100)).to.throw("RGB lightbulbs");
			expect(() => lightWhiteSpectrum.setHue(100)).to.throw("RGB lightbulbs");
		});

		it("setHue() without transition time", async () => {
			lightRGBSpectrum.merge({ hue: 0, saturation: 100 });
			await lightRGBSpectrum.setHue(180).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3311: [{
					5707: 32640,
					5708: 65279,
					5712: 5,
				}],
			});
		});

		it("setHue() with transition time", async () => {
			lightRGBSpectrum.merge({ hue: 0, saturation: 100 });
			await lightRGBSpectrum.setHue(180, 2).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3311: [{
					5707: 32640,
					5708: 65279,
					5712: 20,
				}],
			});
		});

		it("setSaturation() should throw for non-RGB bulbs", async () => {
			expect(() => lightNoSpectrum.setSaturation(100)).to.throw("RGB lightbulbs");
			expect(() => lightWhiteSpectrum.setSaturation(100)).to.throw("RGB lightbulbs");
		});

		it("setSaturation() without transition time", async () => {
			lightRGBSpectrum.merge({ hue: 0, saturation: 100 });
			await lightRGBSpectrum.setSaturation(50).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3311: [{
					5707: 0,
					5708: 32640,
					5712: 5,
				}],
			});
		});

		it("setSaturation() with transition time", async () => {
			lightRGBSpectrum.merge({ hue: 0, saturation: 100 });
			await lightRGBSpectrum.setSaturation(50, 2).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3311: [{
					5707: 0,
					5708: 32640,
					5712: 20,
				}],
			});
		});

	});

	describe("the methods should send the correct payload (white spectrum) =>", () => {

		it("setColorTemperature() should throw for non-white spectrum bulbs", async () => {
			expect(() => lightNoSpectrum.setColorTemperature(50)).to.throw("white spectrum");
			expect(() => lightRGBSpectrum.setColorTemperature(50)).to.throw("white spectrum");
		});

		it("setColorTemperature() without transition time", async () => {
			lightWhiteSpectrum.colorTemperature = 0;
			await lightWhiteSpectrum.setColorTemperature(50).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3311: [{
					5711: 352,
					5712: 5,
				}],
			});
		});

		it("setColorTemperature() with transition time", async () => {
			lightWhiteSpectrum.colorTemperature = 0;
			await lightWhiteSpectrum.setColorTemperature(50, 2).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3311: [{
					5711: 352,
					5712: 20,
				}],
			});
		});
	});

});

describe("ipso/light => spectrum detection (GH#70)", () => {
	// tslint:disable:object-literal-key-quotes
	const rgbPayloads = [
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "dcf0f8", "5707": 0, "5708": 255, "5709": 21109, "5710": 21738, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "eaf6fb", "5707": 0, "5708": 255, "5709": 22616, "5710": 23042, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "f5faf6", "5707": 0, "5708": 255, "5709": 24930, "5710": 24694, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "f2eccf", "5707": 0, "5708": 255, "5709": 28633, "5710": 26483, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "f1e0b5", "5707": 0, "5708": 255, "5709": 30140, "5710": 26909, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "efd275", "5707": 0, "5708": 255, "5709": 33135, "5710": 27211, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "ebb63e", "5707": 0, "5708": 255, "5709": 35848, "5710": 26214, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "e78834", "5707": 0, "5708": 255, "5709": 38011, "5710": 24904, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "e57345", "5707": 0, "5708": 255, "5709": 38011, "5710": 22938, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "da5d41", "5707": 0, "5708": 255, "5709": 40632, "5710": 22282, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "dc4b31", "5707": 0, "5708": 255, "5709": 42926, "5710": 21299, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "e491af", "5707": 0, "5708": 255, "5709": 32768, "5710": 18350, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "e8bedd", "5707": 0, "5708": 255, "5709": 29491, "5710": 18350, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "d9337c", "5707": 0, "5708": 255, "5709": 32768, "5710": 15729, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "c984bb", "5707": 0, "5708": 255, "5709": 22282, "5710": 12452, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "8f2686", "5707": 0, "5708": 255, "5709": 20316, "5710": 8520, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "4a418a", "5707": 0, "5708": 255, "5709": 11469, "5710": 3277, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "6c83ba", "5707": 0, "5708": 255, "5709": 13107, "5710": 6554, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "a9d62b", "5707": 0, "5708": 255, "5709": 26870, "5710": 33423, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 CWS opal 600lm", "2": "", "3": "1.3.002", "6": 1 }, "3311": [{ "5706": "d6e44b", "5707": 0, "5708": 255, "5709": 29491, "5710": 30802, "5711": 0, "5850": 1, "5851": 106, "9003": 0 }], "5750": 2, "9001": "Woonkamer_Bank_Rechts", "9002": 1508005342, "9003": 65537, "9019": 1, "9020": 1508189142, "9054": 0 },
	];

	const wsPayloads = [
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 WS opal 980lm", "2": "", "3": "1.2.217", "6": 1 }, "3311": [{ "5706": "f5faf6", "5709": 24933, "5710": 24691, "5711": 250, "5717": 0, "5850": 1, "5851": 135, "9003": 0 }], "5750": 2, "9001": "Strahler hinter Schreibtisch", "9002": 1521372733, "9003": 65537, "9019": 1, "9020": 1523726758, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 WS opal 980lm", "2": "", "3": "1.2.217", "6": 1 }, "3311": [{ "5706": "f5faf6", "5709": 24933, "5710": 24691, "5711": 250, "5717": 0, "5850": 1, "5851": 135, "9003": 0 }], "5750": 2, "9001": "Strahler hinter Couch", "9002": 1521372771, "9003": 65538, "9019": 1, "9020": 1523683530, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 WS opal 980lm", "2": "", "3": "1.2.217", "6": 1 }, "3311": [{ "5706": "efd275", "5709": 33137, "5710": 27211, "5711": 454, "5717": 0, "5850": 1, "5851": 135, "9003": 0 }], "5750": 2, "9001": "Strahler hinter Schreibtisch", "9002": 1521372733, "9003": 65537, "9019": 1, "9020": 1523726758, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 WS opal 980lm", "2": "", "3": "1.2.217", "6": 1 }, "3311": [{ "5706": "efd275", "5709": 33137, "5710": 27211, "5711": 454, "5717": 0, "5850": 1, "5851": 135, "9003": 0 }], "5750": 2, "9001": "Strahler hinter Couch", "9002": 1521372771, "9003": 65538, "9019": 1, "9020": 1523683530, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 WS opal 980lm", "2": "", "3": "1.2.217", "6": 1 }, "3311": [{ "5706": "efd275", "5709": 33137, "5710": 27211, "5711": 454, "5717": 0, "5850": 1, "5851": 92, "9003": 0 }], "5750": 2, "9001": "Strahler hinter Schreibtisch", "9002": 1521372733, "9003": 65537, "9019": 1, "9020": 1523726758, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 WS opal 980lm", "2": "", "3": "1.2.217", "6": 1 }, "3311": [{ "5706": "efd275", "5709": 33137, "5710": 27211, "5711": 454, "5717": 0, "5850": 1, "5851": 92, "9003": 0 }], "5750": 2, "9001": "Strahler hinter Couch", "9002": 1521372771, "9003": 65538, "9019": 1, "9020": 1523683530, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 WS opal 980lm", "2": "", "3": "1.2.217", "6": 1 }, "3311": [{ "5706": "efd275", "5709": 33137, "5710": 27211, "5711": 454, "5717": 0, "5850": 0, "5851": 92, "9003": 0 }], "5750": 2, "9001": "Strahler hinter Schreibtisch", "9002": 1521372733, "9003": 65537, "9019": 1, "9020": 1523726758, "9054": 0 },
		{ "3": { "0": "IKEA of Sweden", "1": "TRADFRI bulb E27 WS opal 980lm", "2": "", "3": "1.2.217", "6": 1 }, "3311": [{ "5706": "efd275", "5709": 33137, "5710": 27211, "5711": 454, "5717": 0, "5850": 0, "5851": 92, "9003": 0 }], "5750": 2, "9001": "Strahler hinter Couch", "9002": 1521372771, "9003": 65538, "9019": 1, "9020": 1523683530, "9054": 0 },
	];
	// tslint:enable:object-literal-key-quotes

	// TODO: add no-spectrum payloads

	it("should correctly detect the spectrum for recorded payloads", () => {
		for (const payload of rgbPayloads) {
			const bulb = new Accessory().parse(payload).lightList[0];
			bulb.spectrum.should.equal("rgb");
		}

		for (const payload of wsPayloads) {
			const bulb = new Accessory().parse(payload).lightList[0];
			bulb.spectrum.should.equal("white");
		}
	});
});
