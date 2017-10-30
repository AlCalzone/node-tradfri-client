// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

import { expect } from "chai";
import { DeviceInfo } from "./deviceInfo";
// tslint:disable:no-unused-expression

const template = {
	0: "IKEA of Sweden",
	1: "Some long-ass model name",
	2: "",
	3: "1.2.217",
	6: 1,
};
const templateWithBattery = {
	0: "IKEA of Sweden",
	1: "Some long-ass model name",
	2: "",
	3: "1.2.217",
	6: 1,
	9: 99,
};

const di = new DeviceInfo().parse(template);
const diBat = new DeviceInfo().parse(templateWithBattery);

describe("ipso/deviceInfo => parse() =>", () => {

	it("should parse correctly", () => {
		expect(di.manufacturer).to.equal(template["0"]);
		expect(di.modelNumber).to.equal(template["1"]);
		expect(di.serialNumber).to.equal(template["2"]);
		expect(di.firmwareVersion).to.equal(template["3"]);
		expect(di.power).to.equal(template["6"]);
		expect(diBat.battery).to.equal(templateWithBattery["9"]);
	});
	it("the parsed battery level should be undefined if not present", () => {
		expect(di.battery).to.be.undefined;
		expect(diBat.battery).to.not.be.undefined;
	});

});

// nothing special to test for with serialization, e.g. no required properties
