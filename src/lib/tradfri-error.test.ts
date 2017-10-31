import { assert, expect } from "chai";
import { TradfriError, TradfriErrorCodes } from "./tradfri-error";
// tslint:disable:no-unused-expression

describe("lib/tradfri-error => ", () => {

	const err = new TradfriError("Test message", TradfriErrorCodes.ConnectionFailed);
	function thisThrows() {
		throw new TradfriError("Test message", TradfriErrorCodes.ConnectionFailed);
	}
	it("should be of type Error", () => {
		assert(err instanceof Error);
	});

	it("should contain an error code", () => {
		expect(thisThrows).to.throw(TradfriError);
		try {
			thisThrows();
		} catch (e) {
			expect(e.code).to.equal(TradfriErrorCodes.ConnectionFailed);
		}
	});

});
