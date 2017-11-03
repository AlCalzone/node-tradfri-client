// tslint:disable:no-unused-expression
// tslint:disable:variable-name

import { assert, expect, should, use } from "chai";
import { CoapClient as coap, CoapResponse } from "node-coap-client";
import { spy, stub } from "sinon";
import "./"; // dummy-import so index.ts is covered
import { TradfriClient } from "./tradfri-client";

import { ContentFormats } from "node-coap-client/build/ContentFormats";
import { MessageCode } from "node-coap-client/build/Message";
import * as sinonChai from "sinon-chai";
import { TradfriObserverAPI } from "./";
import { DictionaryLike } from "./lib/object-polyfill";

// enable the should interface with sinon
should();
use(sinonChai);

describe("tradfri-client => ", () => {

	const fakeCoap: DictionaryLike<sinon.SinonStub> = {
		observe: null,
		request: null,
		stopObserving: null,
		reset: null,
	};
	let observeDevices_callback: (response: CoapResponse) => Promise<void>;
	let observeDevice_callback: (response: CoapResponse) => Promise<void>;
	const logSpy = spy();
	const tradfri = new TradfriClient("localhost", logSpy);

	const emptyResponse: CoapResponse = {
		code: new MessageCode(2, 5),
		format: ContentFormats.application_json,
		payload: Buffer.from("[]", "utf8"),
	};
	const errorResponse: CoapResponse = {
		code: new MessageCode(4, 1),
		format: ContentFormats.text_plain,
		payload: null,
	};

	before(() => {
		// coap.observe should resolve and call the callback function
		fakeCoap.observe = stub(coap, "observe")
			.callsFake((path: string, method, cb) => {
				if (path.endsWith("15001")) {
					observeDevices_callback = cb;
				} else if (path.indexOf("15001/") > -1) {
					observeDevice_callback = cb;
				}

				cb(emptyResponse);
				return Promise.resolve();
			})
		;
		fakeCoap.request = stub(coap, "request");
		fakeCoap.stopObserving = stub(coap, "stopObserving");
		fakeCoap.reset = stub(coap, "reset");
	});

	after(() => {
		for (const method of Object.keys(fakeCoap)) {
			fakeCoap[method].restore();
		}
	});

	afterEach(() => {
		for (const method of Object.keys(fakeCoap)) {
			fakeCoap[method].resetHistory();
		}
		logSpy.reset();
	});

	describe("observeResource => ", () => {
		it("should call coap.observe with the correct arguments", async () => {
			const cb = spy();
			const expectedUrl = `coaps://localhost:5684/15001`;
			const expectedMethod = "get";
			await tradfri.observeResource("15001", cb);
			fakeCoap.observe.should.have.been.calledWith(expectedUrl, expectedMethod, cb);
			cb.should.have.been.calledOnce;
		});

		it("calling it again should not call coap.observe", async () => {
			const cb = spy();
			await tradfri.observeResource("15001", cb);
			fakeCoap.observe.should.not.have.been.called;
		});
	});

	describe("stopObservingResource => ", () => {
		it("should call coap.stopObserving with the correct url", () => {
			const expectedUrl = `coaps://localhost:5684/15001`;
			tradfri.stopObservingResource("15001");
			fakeCoap.stopObserving.should.have.been.calledWith(expectedUrl);
		});

		it("calling it again should not call coap.stopObserving", () => {
			tradfri.stopObservingResource("15001");
			fakeCoap.stopObserving.should.not.have.been.called;
		});
	});

	describe("reset => ", () => {
		it("should call coap.reset", () => {
			tradfri.reset();
			fakeCoap.reset.should.have.been.called;
		});
	});

	describe("destroy => ", () => {
		it("should call coap.reset", () => {
			tradfri.destroy();
			fakeCoap.reset.should.have.been.called;
		});
	});

	describe("getObserver => ", () => {
		it(`should return an object with "on" and "off" functions`, () => {
			const observer = tradfri.getObserver();
			expect(typeof observer.on).to.equal("function");
			expect(typeof observer.off).to.equal("function");
		});

		it("should return the same object on two different calls", () => {
			const observer1 = tradfri.getObserver();
			const observer2 = tradfri.getObserver();
			assert(observer1 === observer2);
		});
	});

	describe("observeDevices => ", () => {

		// setup the fake responses
		let observer: TradfriObserverAPI;

		it("should call coap.observe for the devices endpoint", async () => {
			const expectedUrl = `coaps://localhost:5684/15001`;
			observer = await tradfri.observeDevices();
			fakeCoap.observe.should.have.been.calledWith(expectedUrl);
		});

		it("should call coap.observe for each observed device", async () => {
			const expectedUrl = `coaps://localhost:5684/15001`;
			const resp = Object.assign(Object.assign({}, emptyResponse), {
				payload: Buffer.from("[65536, 65537]", "utf8"),
			}) as CoapResponse;
			await observeDevices_callback(resp);

			fakeCoap.observe.should.have.been.calledTwice;
			expect(fakeCoap.observe.getCall(0).calledWith(`${expectedUrl}/65536`)).to.be.true;
			expect(fakeCoap.observe.getCall(1).calledWith(`${expectedUrl}/65537`)).to.be.true;
		});

		it("when a device is added, it should only call observe for that one", async () => {
			const expectedUrl = `coaps://localhost:5684/15001`;
			const resp = Object.assign(Object.assign({}, emptyResponse), {
				payload: Buffer.from("[65536, 65537, 65538]", "utf8"),
			}) as CoapResponse;
			await observeDevices_callback(resp);

			fakeCoap.observe.should.have.been.calledOnce;
			fakeCoap.observe.should.have.been.calledWith(`${expectedUrl}/65538`);
		});

		it(`when a device is removed, <observer>.on("device removed") should be called with its id`, async () => {

			const leSpy = spy();
			observer = tradfri.getObserver();
			observer.on("device removed", leSpy);

			const resp = Object.assign(Object.assign({}, emptyResponse), {
				payload: Buffer.from("[65537, 65538]", "utf8"),
			}) as CoapResponse;
			await observeDevices_callback(resp);

			fakeCoap.observe.should.not.have.been.called;
			leSpy.should.have.been.calledOnce;
			leSpy.should.have.been.calledWithExactly(65536);

			observer.off("device removed");
		});

		// something is bugged here
		// it("when the server returns a code other than 2.05, log an error and do nothing else", async () => {

		// 	const leSpy = spy();
		// 	observer = tradfri.getObserver();
		// 	observer.on("device removed", leSpy);

		// 	await observeDevices_callback(errorResponse);

		// 	fakeCoap.observe.should.not.have.been.called;
		// 	leSpy.should.not.have.been.called;
		// 	console.dir(logSpy.getCalls());
		// 	const errorCall = logSpy.getCalls().filter(c => {
		// 		if (c.args[0].startsWith("unexpected") && c.args[1] === "error") return true;
		// 		return false;
		// 	});
		// 	expect(errorCall.length).to.be.greaterThan(0);
		// });

	});

});
