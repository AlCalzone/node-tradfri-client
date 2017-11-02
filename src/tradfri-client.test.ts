import { assert, expect } from "chai";
import { CoapClient as coap } from "node-coap-client";
import { spy, stub } from "sinon";
import "./"; // dummy-import so index.ts is covered
import { TradfriClient } from "./tradfri-client";
// tslint:disable:no-unused-expression

describe("tradfri-client => ", () => {

	let coapObserve: sinon.SinonStub;
	let coapRequest: sinon.SinonStub;

	const tradfri = new TradfriClient("localhost");

	before(() => {
		// coap.observe should resolve and call the callback function
		coapObserve = stub(coap, "observe")
			.callsFake((path, method, cb) => {
				cb();
				return Promise.resolve();
			})
		;
		coapRequest = stub(coap, "request");
	});

	afterEach(() => {
		coapObserve.resetHistory();
		coapRequest.resetHistory();
	});

	it("observeResource should call coap.observe with the correct arguments", async () => {
		const cb = spy();
		const expectedPath = `coaps://localhost:5684/15001`;
		const expectedMethod = "get";
		await tradfri.observeResource("15001", cb);
		expect(coapObserve.calledWith(expectedPath, expectedMethod, cb)).to.equal(true, "coap.observe wasn't called");
		expect(cb.calledOnce).to.equal(true, "The response callback wasn't called");
	});

	it("calling observeResource again should not call coap.observe", async () => {
		const cb = spy();
		await tradfri.observeResource("15001", cb);
		expect(coapObserve.called).to.equal(false, "coap.observe was called when it shouldn't");
	});

	after(() => {
		coapObserve.restore();
		coapRequest.restore();
	});

});
