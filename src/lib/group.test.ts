// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

import { expect } from "chai";
import { Group } from "./group";
import { roundTo } from "./math";
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

const group = new Group().parse(template);

describe("ipso/group =>", () => {

	it("should parse correctly", () => {
		expect(group.onOff).to.equal(template["5850"] === 1);
		expect(group.dimmer).to.equal(roundTo(template["5851"] / 254 * 100, 1));
		expect(group.sceneId).to.equal(template["9039"]);
		expect(group.deviceIDs).to.equal(template["9018"]["15002"]["9003"]);
	});

	it("should serialize correctly", () => {
		// we cheat a bit, because we don't want to have the transition time
		// in the output, since that doesn't exist on the source object
		expect(group.serialize({transitionTime: 0})).to.deep.equal(template);
	});

});
