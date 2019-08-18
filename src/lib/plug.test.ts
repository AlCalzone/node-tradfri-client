// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

// tslint:disable:no-unused-expression

import { assert, expect } from "chai";
import { spy, stub } from "sinon";

import { entries } from "alcalzone-shared/objects";
import { TradfriClient } from "..";
import { createNetworkMock } from "../../test/mocks";
import { Accessory } from "./accessory";
import { IPSOObject } from "./ipsoObject";
import { Plug } from "./plug";

function buildAccessory() {
	const attributes = {
		3: {
			0: "IKEA of Sweden",
			1: "TRADFRI control outlet",
			2: "",
			3: "1.4.020",
			6: 1,
		},
		3312: [
			{
				5850: 0,
				5851: 0,
				9003: 0,
			},
		],
		5750: 3,
		9001: "Uttag",
		9002: 1538388215,
		9003: 65541,
		9019: 1,
		9020: 1540211625,
		9054: 0,
		9084: " 6c ba 7f 97 47 8e 75 88 10 20 29 30 60 a9 3b 7d",
	};
	return attributes;

}

function assertPayload(actual: any, expected: {}, message?: string) {
	expect(actual).to.be.an.instanceof(Buffer, "the payload was no Buffer");
	expect(JSON.parse(actual.toString())).to.deep.equal(expected, message);
}

describe("ipso/plug => basic functionality =>", () => {

	// setup feature table
	interface Device {
		name: string;
		isSwitchable: boolean;
		isDimmable: boolean;
	}
	const deviceTable = new Map<string, Device>();
	function add(name: string, switchable: boolean, dimmable: boolean) {
		deviceTable.set(name, { name, isDimmable: dimmable, isSwitchable: switchable });
	}

	// The only known plug so far
	add("TRADFRI control outlet", true, false);

	it("supported features should be detected correctly", () => {
		for (const device of deviceTable.values()) {
			const acc = new Accessory().parse(buildAccessory());
			const plug = acc.plugList[0];

			expect(plug.isSwitchable).to.equal(device.isSwitchable, `${device.name} should ${device.isSwitchable ? "" : "not "}be switchable`);
			expect(plug.isDimmable).to.equal(device.isDimmable, `${device.name} should ${device.isDimmable ? "" : "not "}be dimmable`);
		}
	});

	it(`the payload to set the state to "on" should be correct`, () => {
		const parsed = new Accessory()
			.parse(buildAccessory())
			.createProxy()
			;
		parsed.plugList[0].onOff = false;
		const original = parsed.clone();
		const plug = parsed.plugList[0];

		plug.onOff = true;
		const serialized = parsed.serialize(original);
		expect(serialized).to.deep.equal({
			3312: [{ 5850: 1 }],
		});
	});

	it(`the payload to set the state to "off" should be correct`, () => {
		const parsed = new Accessory()
			.parse(buildAccessory())
			.createProxy()
			;
		parsed.plugList[0].onOff = true;
		const original = parsed.clone();
		const plug = parsed.plugList[0];

		plug.onOff = false;
		const serialized = parsed.serialize(original);
		expect(serialized).to.deep.equal({
			3312: [{ 5850: 0 }],
		});
	});

	describe(`the payload to dim the plug should be correct`, () => {
		it("with the simplified scale", () => {
			const parsed = new Accessory()
				.parse(buildAccessory())
				.createProxy()
				;
			parsed.plugList[0].dimmer = 0;
			const original = parsed.clone();
			const plug = parsed.plugList[0];

			plug.dimmer = 10;
			const serialized = parsed.serialize(original);
			expect(serialized).to.deep.equal({
				3312: [{ 5851: 25 }],
			});
		});

		it("with raw CoAP values", () => {
			const parsed = new Accessory({ skipValueSerializers: true })
				.parse(buildAccessory())
				.createProxy()
				;
			parsed.plugList[0].dimmer = 0;
			const original = parsed.clone();
			const plug = parsed.plugList[0];

			plug.dimmer = 26;
			const serialized = parsed.serialize(original);
			expect(serialized).to.deep.equal({
				3312: [{ 5851: 26 }],
			});
		});

	});

	it("cloning a plug should create a deep copy of it", () => {
		const acc = new Accessory().parse(buildAccessory());
		const plug = acc.plugList[0];
		const clone = plug.clone();
		// plug should be !== clone, but its properties should be identical
		expect(plug).to.deep.equal(clone);
		expect(plug).to.not.equal(clone);
	});

});

describe("ipso/plug => simplified API => ", () => {

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
		"setBrightness",
	];

	describe("all methods should fail when no client instance has been linked", () => {
		// Create a new plug without a linked client instance
		const unlinked = new Plug();
		for (const method of apiMethods) {
			it(method, () => {
				expect(unlinked[method].bind(unlinked)).to.throw("linked to a client");
			});
		}
	});

	describe("all methods should fail when no accessory instance has been linked", () => {
		// Create a new plug without a linked accessory instance
		const linked = new Plug();
		linked.link(tradfri);

		for (const method of apiMethods) {
			it(method, () => {
				expect(linked[method].bind(linked)).to.throw("linked to an Accessory");
			});
		}
	});

	const plugAcc = new Accessory().parse(buildAccessory()).link(tradfri);
	const plug = plugAcc.plugList[0];

	describe("the methods should send the correct payload =>", () => {

		it("turnOn() when the plug is off", async () => {
			plug.onOff = false;
			await plug.turnOn().should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3312: [{
					5850: 1,
				}],
			});
		});

		it("turnOn() when the plug is on", async () => {
			plug.onOff = true;
			await plug.turnOn().should.become(false);
			fakeCoap.request.should.not.have.been.called;
		});

		it("turnOff() when the plug is on", async () => {
			plug.onOff = true;
			await plug.turnOff().should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3312: [{
					5850: 0,
				}],
			});
		});

		it("turnOff() when the plug is off", async () => {
			plug.onOff = false;
			await plug.turnOff().should.become(false);
			fakeCoap.request.should.not.have.been.called;
		});

		it("toggle(true) when the plug is off", async () => {
			plug.onOff = false;
			await plug.toggle(true).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3312: [{
					5850: 1,
				}],
			});
		});

		it("toggle(true) when the plug is on", async () => {
			plug.onOff = true;
			await plug.toggle(true).should.become(false);
			fakeCoap.request.should.not.have.been.called;
		});

		it("toggle(false) when the plug is on", async () => {
			plug.onOff = true;
			await plug.toggle(false).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3312: [{
					5850: 0,
				}],
			});
		});

		it("toggle(false) when the plug is off", async () => {
			plug.onOff = false;
			await plug.toggle(false).should.become(false);
			fakeCoap.request.should.not.have.been.called;
		});

		it("toggle() when the plug is off", async () => {
			plug.onOff = false;
			await plug.toggle().should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3312: [{
					5850: 1,
				}],
			});
		});

		it("toggle() when the plug is on", async () => {
			plug.onOff = true;
			await plug.toggle().should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3312: [{
					5850: 0,
				}],
			});
		});

		it("setBrightness() ", async () => {
			plug.dimmer = 0;
			await plug.setBrightness(100).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				3312: [{
					5851: 254,
				}],
			});
		});

	});

});
