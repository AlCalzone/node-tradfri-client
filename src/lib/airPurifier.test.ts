// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

// tslint:disable:no-unused-expression

import { assert, expect } from "chai";
import { spy, stub } from "sinon";

import { entries } from "alcalzone-shared/objects";
import { AirPurifier, FanMode, TradfriClient } from "..";
import { createNetworkMock } from "../../test/mocks";
import { Accessory } from "./accessory";
import { Blind } from "./blind";
import { IPSOObject } from "./ipsoObject";

function buildAccessory() {
	const attributes = {
		"3": {
			"0": "IKEA of Sweden",
			"1": "STARKVIND Air purifier",
			"2": "",
			"3": "1.0.033",
			"6": 1,
			"7": 4364,
		},
		"5750": 10,
		"9001": "NAME_OF_THE_DEVICE",
		"9002": 1636224627,
		"9003": 65560,
		"9019": 1,
		"9020": 1636720780,
		"9054": 0,
		"15025": [
			{
				"5900": 1,
				"5902": 4176,
				"5903": 0,
				"5904": 259200,
				"5905": 0,
				"5906": 0,
				"5907": 59,
				"5908": 15,
				"5909": 4132,
				"5910": 255024,
				"9003": 0,
			},
		],
	};
	return attributes;
}

function assertPayload(actual: any, expected: {}, message?: string) {
	expect(actual).to.be.an.instanceof(Buffer, "the payload was no Buffer");
	expect(JSON.parse(actual.toString())).to.deep.equal(expected, message);
}

describe("ipso/airPurifier => basic functionality =>", () => {
		it(`the payload to set the fan mode to auto should be correct`, () => {
		const parsed = new Accessory().parse(buildAccessory()).createProxy();
		parsed.airPurifierList[0].fanMode = FanMode.Off;
		const original = parsed.clone();
		const ap = parsed.airPurifierList[0];

		ap.fanMode = FanMode.Auto;
		const serialized = parsed.serialize(original);
		expect(serialized).to.deep.equal({
			15025: [{ 5900: 1 }],
		});
	});

	it("cloning an air purifier should create a deep copy of it", () => {
		const acc = new Accessory().parse(buildAccessory());
		const ap = acc.airPurifierList[0];
		const clone = ap.clone();
		// ap should be !== clone, but its properties should be identical
		expect(ap).to.deep.equal(clone);
		expect(ap).to.not.equal(clone);
	});
});

describe("ipso/airPurifier => simplified API => ", () => {
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
		"setFanMode",
		"setFanSpeed",
		"setControlsLocked",
		"setStatusLEDs",
	];

	describe("all methods should fail when no client instance has been linked", () => {
		// Create a new blind without a linked client instance
		const unlinked = new AirPurifier();
		for (const method of apiMethods) {
			it(method, () => {
				expect(unlinked[method].bind(unlinked)).to.throw("linked to a client");
			});
		}
	});

	describe("all methods should fail when no accessory instance has been linked", () => {
		// Create a new blind without a linked accessory instance
		const linked = new AirPurifier();
		linked.link(tradfri);

		for (const method of apiMethods) {
			it(method, () => {
				expect(linked[method].bind(linked)).to.throw("linked to an Accessory");
			});
		}
	});

	const apAcc = new Accessory().parse(buildAccessory()).link(tradfri);
	const ap = apAcc.airPurifierList[0];

	describe("the methods should send the correct payload =>", () => {
		it("setFanMode(not off) when the fan is off", async () => {
			ap.fanMode = FanMode.Off;
			await ap.setFanMode(FanMode.Level2).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				15025: [
					{
						5900: FanMode.Level2,
					},
				],
			});
		});

		it("setFanMode(off) when the fan is off", async () => {
			ap.fanMode = FanMode.Off;
			await ap.setFanMode(FanMode.Off).should.become(false);
			fakeCoap.request.should.not.have.been.called;
		});

		it("setFanSpeed() ", async () => {
			ap.fanSpeed = 0;
			await ap.setFanSpeed(41).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				15025: [
					{
						5908: 40, // rounded to the nearest multiple of 5
					},
				],
			});
		});

		it("setControlsLocked()", async () => {
			ap.controlsLocked = false;
			await ap.setControlsLocked(true).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				15025: [
					{
						5905: 1,
					},
				],
			});
		});

		it("setStatusLEDs()", async () => {
			ap.statusLEDs = false;
			await ap.setStatusLEDs(true).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				15025: [
					{
						5906: 0,
					},
				],
			});
		});
	});
});
