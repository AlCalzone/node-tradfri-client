// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

import { assert, expect } from "chai";
import { Accessory, AccessoryTypes } from "./accessory";
import { DeviceInfo } from "./deviceInfo";
import { Light } from "./light";
// tslint:disable:no-unused-expression

const template = {
	3: {
		0: "IKEA of Sweden",
		// we need to use a RGB bulb here,
		// so all properties get serialized
		1: "TRADFRI bulb E27 CWS opal 600",
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
			5711: 250, // this is supported as of v0.6.0 / Gateway v1.3
			5850: 1,
			5851: 254,
			9003: 0,
		},
	],
	5750: 2,
	9001: "Some long-ass model name",
	9002: 1499440525,
	9003: 65538,
	9019: 1,
	9020: 1507456927,
	9054: 0,
};

const rgbTemplate = {
	3: {
		0: "IKEA of Sweden",
		1: "TRADFRI bulb E27 CWS opal 600lm",
		2: "",
		3: "1.3.002",
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
	9001: "Woonkamer_Bank_Rechts",
	9002: 1508005342,
	9003: 65537,
	9019: 1,
	9020: 1508012549,
	9054: 0,
};

const acc = new Accessory().parse(template);
const proxyAcc = new Accessory().parse(template).createProxy();

describe("ipso/accessory => ", () => {

	function testParse(obj: Accessory) {
		assert(obj.deviceInfo instanceof DeviceInfo, "the deviceInfo must be of type DeviceInfo");
		expect(obj.lightList).to.have.length(1);
		assert(obj.lightList[0] instanceof Light, "the light array items must be of type Light");
		expect(obj.type).to.equal(template["5750"]);
	}

	it("should parse correctly", () => {
		testParse(acc);
	});
	it("should parse correctly when proxied", () => {
		testParse(proxyAcc);
	});

	function testSerialize(obj: Accessory) {
		// note: we manually check for property equality since we're going to
		// serialize a few more values than the gateway reports
		const serialized = obj.serialize();

		// check all properties except the light list
		for (const key in Object.keys(serialized)) {
			if (key !== "3311") expect(serialized[key]).to.deep.equal(template[key]);
		}

		// compare all lights
		const ignoredProperties = [
			"5706", // we don't send the RGB hex string
			"5709", // we also don't send colorX/Y anymore
			"5710", // we also don't send colorX/Y anymore
		];
		expect(serialized["3311"].length).to.equal(template["3311"].length);
		for (let i = 0; i < serialized["3311"].length; i++) {
			const entry = serialized["3311"][i];
			const templateEntry = template["3311"][i];
			for (const prop of Object.keys(templateEntry)) {
				if (ignoredProperties.indexOf(prop) === -1) {
					expect(entry[prop]).to.equal(templateEntry[prop]);
				}
			}
		}
	}
	it("should serialize correctly", () => {
		testSerialize(acc);
	});
	it("should serialize correctly when proxied", () => {
		testSerialize(proxyAcc);
	});

	function testSerializeReference(obj: Accessory) {
		const original = obj.clone();
		expect(obj.serialize(original)).to.deep.equal({});

		obj.merge({name: "Test"});
		expect(obj.serialize(original)).to.deep.equal({9001: "Test"});

		obj.lightList[0].merge({name: "Blub"});
		// note: we use include here, since Light has the required property transitionTime
		expect(obj.serialize(original)["3311"][0]).to.include({9001: "Blub"});
	}
	it("should serialize correctly when a reference is given", () => {
		testSerializeReference(acc);
	});
	it("should serialize correctly when a reference is given and proxied", () => {
		testSerializeReference(proxyAcc);
	});

	it("the name of RGB bulbs (v1.3.002) should be parsed correctly", () => {
		const rgb = new Accessory().parse(rgbTemplate);
		expect(rgb.name).to.equal(rgbTemplate["9001"]);
	});
});

describe("ipso/accessory => firmware bugfixes => ", () => {
	// repro for GH#67
	describe("lights announced as remote controls => ", () => {

		const brokenPayload = {
			3: {
				0: "IKEA of Sweden",
				1: "TRADFRI bulb E27 WS opal 980lm",
				2: "",
				3: "1.2.217",
				6: 1,
			},
			5750: 0,
			9001: "Sauna Light",
			9002: 1520186295,
			9003: 65561,
			9019: 1,
			9020: 1521830451,
			9054: 0,
			15009: [
				{
					5706: "efd275",
					5709: 33137,
					5710: 27211,
					5711: 454,
					5717: 0,
					5850: 0,
					5851: 254,
					9003: 0,
				},
			],
		};

		const parsed = new Accessory().parse(brokenPayload).fixBuggedProperties();

		it("should be parsed correctly with fixBuggedProperties()", () => {
			parsed.type.should.equal(AccessoryTypes.lightbulb);
			expect(parsed.lightList).to.not.be.null;
			expect(parsed.lightList).to.have.length(1);
			expect(parsed.switchList).to.be.null;
		});

		// as this is a WS bulb, some properties won't be serialized
		const expectedPayload = {
			3: {
				0: "IKEA of Sweden",
				1: "TRADFRI bulb E27 WS opal 980lm",
				2: "",
				3: "1.2.217",
				6: 1,
			},
			5750: 0,
			9001: "Sauna Light",
			9002: 1520186295,
			9003: 65561,
			9019: 1,
			9020: 1521830451,
			9054: 0,
			15009: [
				{
					// - 5706: "efd275",
					// - 5709: 33137,
					// - 5710: 27211,
					5711: 454,
					/* + */ 5712: 5, // always present in serialized payloads
					5717: 0,
					5850: 0,
					5851: 254,
					/* + */ 9001: "",	// these are usually not serialized with a reference object
					/* + */ 9002: 0,	// these are usually not serialized with a reference object
					9003: 0,
				},
			],
		};

		it("should be serialized correctly with restoreBuggedProperties()", () => {
			for (let tries = 1; tries <= 3; tries++) {
				expect(parsed.restoreBuggedProperties().serialize()).to.deep.equal(
					expectedPayload, `try ${tries} failed`,
				);
			}
		});
	});
});
