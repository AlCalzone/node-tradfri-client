// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

import { expect } from "chai";
import { UpdatePriority } from "./gatewayDetails";
import { FirmwareUpdateNotification, Notification, NotificationTypes } from "./notification";
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
		expect(not.isActive).to.equal(template["9014"] === 1);
		expect(not.event).to.equal(template["9015"]);
		expect(not.details).to.be.an.instanceof(FirmwareUpdateNotification);
		expect((not.details as FirmwareUpdateNotification).priority).to.equal(UpdatePriority.Forced);
	});

});

// nothing special to test for with serialization, e.g. no required properties
