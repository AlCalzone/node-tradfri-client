// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

import { roundTo } from "alcalzone-shared/math";
import { expect } from "chai";
import { Scene } from "..";
import { createNetworkMock } from "../../test/mocks";
import { Group } from "./group";
// tslint:disable:no-unused-expression

const template = {
	5850: 1,
	5851: 152,
	9001: "STARTERSET",
	9002: 1493149388,
	9003: 132848,
	9018: {
		15002: {
			9003: [
				65536,
				65537,
				65538,
			],
		},
	},
	9039: 201141,
};

function assertPayload(actual: any, expected: {}, message?: string) {
	expect(actual).to.be.an.instanceof(Buffer, "the payload was no Buffer");
	expect(JSON.parse(actual.toString())).to.deep.equal(expected, message);
}

describe("ipso/group => basic functionality => ", () => {

	const group = new Group().parse(template);

	it("should parse correctly", () => {
		expect(group.onOff).to.equal(template["5850"] === 1);
		expect(group.dimmer).to.equal(roundTo(template["5851"] / 254 * 100, 1));
		expect(group.sceneId).to.equal(template["9039"]);
		expect(group.deviceIDs).to.equal(template["9018"]["15002"]["9003"]);
	});

	it("should serialize correctly", () => {
		expect(group.serialize()).to.deep.equal(template);
	});

	it(`should serialize correctly when transitionTime has the value "null"`, () => {
		// repro for issue#51
		const brokenGroup = group.clone();
		brokenGroup.transitionTime = null;
		const reference = brokenGroup.clone();
		brokenGroup.onOff = !brokenGroup.onOff;

		expect(brokenGroup.serialize(reference)).to.deep.equal({
			5850: brokenGroup.onOff ? 1 : 0,
		});
	});

});

describe("ipso/group => simplified API => ", () => {

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
		"activateScene", "setBrightness",
	];

	describe("all methods should fail when no client instance has been linked", () => {
		// Create a new light without a linked client instance
		const unlinked = new Group();
		for (const method of apiMethods) {
			it(method, () => {
				expect(unlinked[method].bind(unlinked)).to.throw("linked to a client");
			});
		}
	});

	const group = new Group().parse(template).link(tradfri);

	describe("the methods should send the correct payload and not care about the previous state =>", () => {

		it("turnOn()", async () => {
			for (const prevState of [true, false]) {
				group.onOff = prevState;
				await group.turnOn().should.become(true);
				assertPayload(fakeCoap.request.getCall(fakeCoap.request.callCount - 1).args[2], {
					5850: 1,
				});
			}
		});

		it("turnOff()", async () => {
			for (const prevState of [true, false]) {
				group.onOff = prevState;
				await group.turnOff().should.become(true);
				assertPayload(fakeCoap.request.getCall(fakeCoap.request.callCount - 1).args[2], {
					5850: 0,
				});
			}
		});

		it("toggle(true)", async () => {
			for (const prevState of [true, false]) {
				group.onOff = prevState;
				await group.toggle(true).should.become(true);
				assertPayload(fakeCoap.request.getCall(fakeCoap.request.callCount - 1).args[2], {
					5850: 1,
				});
			}
		});

		it("toggle(false)", async () => {
			for (const prevState of [true, false]) {
				group.onOff = prevState;
				await group.toggle(false).should.become(true);
				assertPayload(fakeCoap.request.getCall(fakeCoap.request.callCount - 1).args[2], {
					5850: 0,
				});
			}
		});

		it("setBrightness() without transition time", async () => {
			for (const prevState of [0, 50, 100]) {
				group.dimmer = prevState;
				await group.setBrightness(100).should.become(true);
				assertPayload(fakeCoap.request.getCall(fakeCoap.request.callCount - 1).args[2], {
					5851: 254,
				});
			}
		});

		it("setBrightness() with transition time", async () => {
			for (const prevState of [0, 50, 100]) {
				group.dimmer = prevState;
				await group.setBrightness(100, 2).should.become(true);
				assertPayload(fakeCoap.request.getCall(fakeCoap.request.callCount - 1).args[2], {
					5851: 254,
					5712: 20,
				});
			}
		});

		it("setPosition()", async () => {
			for (const prevState of [0, 50, 100]) {
				group.position = prevState;
				await group.setPosition(100).should.become(true);
				assertPayload(fakeCoap.request.getCall(fakeCoap.request.callCount - 1).args[2], {
					5536: 0,
				});
			}
		});

		it("activateScene() when the scene is NOT the active one", async () => {
			// with the scene ID
			await group.activateScene(123456).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				9039: 123456,
				5850: 1,
			});

			// with an actual scene
			const scene = new Scene();
			scene.instanceId = 654321;
			await group.activateScene(scene).should.become(true);
			assertPayload(fakeCoap.request.getCall(1).args[2], {
				9039: scene.instanceId,
				5850: 1,
			});
		});

		it("activateScene() when the scene IS the active one", async () => {
			// with the scene ID
			group.sceneId = 123456;
			await group.activateScene(123456).should.become(true);
			assertPayload(fakeCoap.request.getCall(0).args[2], {
				9039: 123456,
				5850: 1,
			});

			// with an actual scene
			const scene = new Scene();
			scene.instanceId = 123456;
			await group.activateScene(scene).should.become(true);
			assertPayload(fakeCoap.request.getCall(1).args[2], {
				9039: scene.instanceId,
				5850: 1,
			});
		});

	});
});
