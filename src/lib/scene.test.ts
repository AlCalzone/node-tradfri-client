// REMARK: also tests LightSetting

// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

import { assert, expect } from "chai";
import { LightSetting } from "./lightSetting";
import { Scene } from "./scene";
// tslint:disable:no-unused-expression

const template = {
	9001: "FOCUS",
	9002: 1493149388,
	9003: 201141,
	9057: 2,
	9068: 1,
	15013: [
		{
			5706: "f5faf6",
			5707: 0,
			5708: 0,
			5709: 24930,
			5710: 24694,
			5711: 0,
			5850: 1,
			5851: 254,
			9003: 65537,
		},
		{
			5706: "f5faf6",
			5707: 0,
			5708: 0,
			5709: 24930,
			5710: 24694,
			5711: 0,
			5850: 1,
			5851: 254,
			9003: 65538,
		},
	],
};

const scene = new Scene().parse(template);

describe("ipso/scene => parse() =>", () => {

	it("should parse correctly", () => {
		expect(scene.sceneIndex).to.equal(template["9057"]);
		expect(scene.isPredefined).to.equal(template["9068"] === 1);
		expect(scene.lightSettings).to.have.length(2);
		assert(scene.lightSettings[0] instanceof LightSetting);
		expect(scene.lightSettings[1].color).to.equal(template["15013"][1]["5706"]);
	});

});

// nothing special to test for with serialization, e.g. no required properties
