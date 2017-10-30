// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

import { expect } from "chai";
import { Notification, NotificationTypes } from "./notification";
// tslint:disable:no-unused-expression

const template = {
	9002: 1493149060,
	9014: 0,
	9015: 1001,
	9017: [
		"9066=5",
	],
};

const not = new Notification().parse(template);

describe("ipso/notification => parse() =>", () => {

	it("should parse correctly", () => {
		expect(not.state).to.equal(template["9014"]);
		expect(not.event).to.equal(template["9015"]);
		expect(Object.keys(not.details)).to.have.length(1);
		expect(not.details["9066"]).to.equal("5");
	});

});

// nothing special to test for with serialization, e.g. no required properties
