import { assert, expect } from "chai";
import { spy, stub } from "sinon";

import { log, setCustomLogger } from "./logger";

// tslint:disable:no-unused-expression

describe("lib/logger => ", () => {

	let loggerStub: sinon.SinonSpy;

	it(`gets called with the correct arguments`, () => {
		loggerStub = spy();
		setCustomLogger(loggerStub);

		log("message", "debug");

		expect(loggerStub.calledOnce).to.be.true;
		assert(loggerStub.calledWithExactly("message", "debug"));
	});

	it(`has a default severity of "info"`, () => {
		loggerStub = spy();
		setCustomLogger(loggerStub);

		log("message");

		assert(loggerStub.calledWithExactly("message", "info"));
	});

	// were not testing the debug package redirection

});
