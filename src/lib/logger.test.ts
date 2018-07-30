// tslint:disable:no-console
// tslint:disable:no-unused-expression
// tslint:disable:variable-name

import { assert, expect } from "chai";
import { spy, stub } from "sinon";

// stub out the debug package for logger
import * as debugPackage from "debug";
const debugSpy = stub();
import * as proxyquire from "proxyquire";
const { log, setCustomLogger } = proxyquire("./logger", {
	debug: stub().callsFake(namespace => {
		if (namespace === "node-tradfri-client") return debugSpy;
		return debugPackage(namespace);
	}),
});

describe("lib/logger => ", () => {

	let loggerStub: sinon.SinonSpy;

	beforeEach(debugSpy.resetHistory);

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

	it(`uses the "debug" package by default`, () => {
		setCustomLogger(undefined);

		log("message");
		debugSpy.should.have.been.calledOnce;
		debugSpy.should.have.been.calledWith("message");
	});

	it(`using the default logger prepends the severity to the message in UPPERCASE`, () => {
		// except for info
		log("message");
		debugSpy.should.have.been.calledWithExactly("message");

		for (const sev of ["warn", "debug", "error", "silly"]) {
			debugSpy.resetHistory();
			log("message", sev);
			debugSpy.should.have.been.calledWithExactly(`[${sev.toUpperCase()}] message`);
		}
	});

});
