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
import { Blind } from "./blind";
import { IPSOObject } from "./ipsoObject";

function buildAccessory() {
	const attributes = {
		3: {
			0: "IKEA of Sweden",
			1: "FYRTUR smart blind", // TODO: find out the correct name
			2: "",
			3: "1.4.020", // TODO
			6: 1,
		},
		15015: [
			{
				5536: 27.4,
				9003: 0,
			},
		],
		5750: 5,
		9001: "Smart blind",
		9002: 1538388215,
		9003: 65541,
		9019: 1,
		9020: 1540211625,
		9054: 0,
	};
	return attributes;

}

function assertPayload(actual: any, expected: {}, message?: string) {
	expect(actual).to.be.an.instanceof(Buffer, "the payload was no Buffer");
	expect(JSON.parse(actual.toString())).to.deep.equal(expected, message);
}

describe("ipso/blind => basic functionality =>", () => {

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

	// The only known blind so far
	add("FYRTUR smart blind", false, true); // TODO: find out the correct name!

	it("supported features should be detected correctly", () => {
		for (const device of deviceTable.values()) {
			const acc = new Accessory().parse(buildAccessory());
			const blind = acc.blindList[0];

			expect(blind.isSwitchable).to.equal(device.isSwitchable, `${device.name} should ${device.isSwitchable ? "" : "not "}be switchable`);
			expect(blind.isDimmable).to.equal(device.isDimmable, `${device.name} should ${device.isDimmable ? "" : "not "}be dimmable`);
		}
	});

	it(`the payload to set the position to 100 should be correct`, () => {
		const parsed = new Accessory()
			.parse(buildAccessory())
			.createProxy()
			;
		parsed.blindList[0].position = 0;
		const original = parsed.clone();
		const blind = parsed.blindList[0];

		blind.position = 100;
		const serialized = parsed.serialize(original);
		expect(serialized).to.deep.equal({
			15015: [{ 5536: 100 }],
		});
	});

	it(`the payload to set the position to 0 should be correct`, () => {
		const parsed = new Accessory()
			.parse(buildAccessory())
			.createProxy()
			;
		parsed.blindList[0].position = 100;
		const original = parsed.clone();
		const blind = parsed.blindList[0];

		blind.position = 0;
		const serialized = parsed.serialize(original);
		expect(serialized).to.deep.equal({
			15015: [{ 5536: 0 }],
		});
	});

	it("cloning a blind should create a deep copy of it", () => {
		const acc = new Accessory().parse(buildAccessory());
		const blind = acc.blindList[0];
		const clone = blind.clone();
		// blind should be !== clone, but its properties should be identical
		expect(blind).to.deep.equal(clone);
		expect(blind).to.not.equal(clone);
	});

});

describe("ipso/blind => simplified API => ", () => {

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
		"open", "close", "setPosition",
	];

	describe("all methods should fail when no client instance has been linked", () => {
		// Create a new blind without a linked client instance
		const unlinked = new Blind();
		for (const method of apiMethods) {
			it(method, () => {
				expect(unlinked[method].bind(unlinked)).to.throw("linked to a client");
			});
		}
	});

	describe("all methods should fail when no accessory instance has been linked", () => {
		// Create a new blind without a linked accessory instance
		const linked = new Blind();
		linked.link(tradfri);

		for (const method of apiMethods) {
			it(method, () => {
				expect(linked[method].bind(linked)).to.throw("linked to an Accessory");
			});
		}
	});

	const blindAcc = new Accessory().parse(buildAccessory()).link(tradfri);
	const blind = blindAcc.blindList[0];

	describe("the methods should send the correct payload =>", () => {

		it("open() when the blinds are down", async () => {
			blind.position = 0;
			await blind.open().should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				15015: [{
					5536: 100,
				}],
			});
		});

		it("open() when the blinds are completely open", async () => {
			blind.position = 100;
			await blind.open().should.become(false);
			fakeCoap.request.should.not.have.been.called;
		});

		it("close() when the blinds are open", async () => {
			blind.position = 100;
			await blind.close().should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				15015: [{
					5536: 0,
				}],
			});
		});

		it("close() when the blinds are completely closed", async () => {
			blind.position = 0;
			await blind.close().should.become(false);
			fakeCoap.request.should.not.have.been.called;
		});

		it("setPosition() ", async () => {
			blind.position = 0;
			await blind.setPosition(47.9).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				15015: [{
					5536: 47.9,
				}],
			});
		});

	});

});
