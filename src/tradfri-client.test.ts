// tslint:disable:no-console
// tslint:disable:no-unused-expression
// tslint:disable:variable-name

import { assert, expect, should, use } from "chai";
import { CoapClient as coap, CoapResponse } from "node-coap-client";
import { spy, stub } from "sinon";
import "./"; // dummy-import so index.ts is covered
import { TradfriClient } from "./tradfri-client";

import { ContentFormats } from "node-coap-client/build/ContentFormats";
import { MessageCode, MessageCodes } from "node-coap-client/build/Message";
import * as sinonChai from "sinon-chai";
import { createEmptyAccessoryResponse, createNetworkMock, createResponse, createRGBBulb, createErrorResponse } from "../test/mocks";
import { Accessory, Light, TradfriError, TradfriErrorCodes } from "./";
import { createDeferredPromise, DeferredPromise } from "./lib/defer-promise";
import { padStart } from "./lib/strings";

// enable the should interface with sinon
should();
use(sinonChai);

function assertPayload(actual: any, expected: {}) {
	expect(actual).to.be.an.instanceof(Buffer);
	expect(JSON.parse(actual.toString())).to.deep.equal(expected);
}

describe("tradfri-client => surrounding functionality => ", () => {

	// Setup the mock
	const {
		tradfri,
		devicesUrl,
		fakeCoap,
		callbacks,
		createStubs,
		restoreStubs,
		resetStubHistory,
	} = createNetworkMock();
	before(createStubs);
	after(restoreStubs);
	afterEach(resetStubHistory);

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

	describe("connect => ", () => {
		const identity = "IDENTITY";
		const psk = "PSK";

		it("should reset the CoAP client, provide new security params and return the result from tryToConnect", async () => {
			// test if both possible responses are passed through
			fakeCoap.tryToConnect.returns(Promise.resolve(true));
			await tradfri.connect(identity, psk).should.become(true);

			fakeCoap.tryToConnect.returns(Promise.resolve(false));
			await tradfri.connect(identity, psk).should.become(false);

			fakeCoap.reset.should.have.been.called;
			fakeCoap.setSecurityParams.should.have.been.called;
			fakeCoap.setSecurityParams.getCall(0).args[1].should.deep.equal({
				psk: { [identity]: psk },
			});
			fakeCoap.tryToConnect.should.have.been.called;

			fakeCoap.tryToConnect.resetBehavior();
		});
	});

	describe("authenticate => ", () => {

		const dummyIdentity = "IDENTITY";
		const generatedPSK = "ABCDEFG";
		const failedAuthResponse = createResponse(null, MessageCodes.clientError.unauthorized);
		const authResponse = createResponse({ 9091: generatedPSK }, MessageCodes.success.created);

		afterEach(() => {
			fakeCoap.tryToConnect.resetBehavior();
			fakeCoap.request.resetBehavior();
		});

		it(`detects failure to connect with "Client_identity" as a wrong security code`, async () => {
			fakeCoap.tryToConnect.returns(Promise.resolve(false));
			await tradfri.authenticate(null).should.be.rejectedWith("security code");
		});

		it(`should call coap.request with the correct endpoint and payload and return the identity and psk`, async () => {
			fakeCoap.tryToConnect.returns(Promise.resolve(true));
			fakeCoap.request.returns(Promise.resolve(authResponse));
			let generatedIdentity: string;
			await tradfri.authenticate(dummyIdentity).should.be.fulfilled.then(({ identity, psk }) => {
				expect(identity.startsWith("tradfri_")).to.be.true;
				generatedIdentity = identity;
				expect(psk).to.equal(generatedPSK);
			});

			fakeCoap.request.should.have.been.called;
			fakeCoap.request.getCall(0).args[0].should.equal(`coaps://localhost:5684/15011/9063`);
			fakeCoap.request.getCall(0).args[1].should.equal("post");
			assertPayload(
				fakeCoap.request.getCall(0).args[2],
				{ 9090: generatedIdentity },
			);
		});

		it(`if coap.request returns an error, throw AuthenticationFailed`, async () => {
			fakeCoap.tryToConnect.returns(Promise.resolve(true));
			fakeCoap.request.returns(Promise.resolve(failedAuthResponse));
			await tradfri.authenticate(dummyIdentity).should.be.rejected.then(err => {
				expect(err).to.be.an.instanceof(TradfriError);
				expect((err as TradfriError).code).to.equal(TradfriErrorCodes.AuthenticationFailed);
			});
		});

	});

});

describe("tradfri-client => observing resources => ", () => {

	// Setup the mock
	const {
		tradfri,
		devicesUrl,
		fakeCoap,
		callbacks,
		createStubs,
		restoreStubs,
		resetStubHistory,
	} = createNetworkMock();
	before(createStubs);
	after(restoreStubs);
	afterEach(resetStubHistory);

	describe("observeResource => ", () => {
		it("should call coap.observe with the correct arguments", async () => {
			const cb = spy();
			const expectedUrl = devicesUrl;
			const expectedMethod = "get";
			await tradfri.observeResource("15001", cb);
			fakeCoap.observe.should.have.been.calledWith(expectedUrl, expectedMethod, cb);
		});

		it("calling it again should not call coap.observe", async () => {
			const cb = spy();
			await tradfri.observeResource("15001", cb);
			fakeCoap.observe.should.not.have.been.called;
		});

		it("calling it again with an absolute path should also not call coap.observe", async () => {
			const cb = spy();
			await tradfri.observeResource("coaps://localhost:5684/15001", cb);
			fakeCoap.observe.should.not.have.been.called;
		});

		it("after resetting the client, coap.observe should be called again", async () => {
			tradfri.reset();
			const cb = spy();
			await tradfri.observeResource("15001", cb);
			fakeCoap.observe.should.have.been.called;
		});
	});

	describe("stopObservingResource => ", () => {
		it("should call coap.stopObserving with the correct url", () => {
			const expectedUrl = devicesUrl;
			tradfri.stopObservingResource("15001");
			fakeCoap.stopObserving.should.have.been.calledWith(expectedUrl);
		});

		it("calling it again should not call coap.stopObserving", () => {
			tradfri.stopObservingResource("15001");
			fakeCoap.stopObserving.should.not.have.been.called;
		});

		it("after observing a resource, coap.stopObserving should be called again", async () => {
			await tradfri.observeResource("15001", null);
			tradfri.stopObservingResource("15001");
			fakeCoap.stopObserving.should.have.been.called;
		});
	});

});

describe("tradfri-client => observing devices => ", () => {

	// Setup the mock
	const {
		tradfri,
		devicesUrl,
		fakeCoap,
		callbacks,
		createStubs,
		restoreStubs,
		resetStubHistory,
	} = createNetworkMock();
	before(createStubs);
	after(restoreStubs);
	afterEach(resetStubHistory);

	describe("observeDevices => ", () => {

		it("should call coap.observe for the devices endpoint and for each observed device", async () => {
			// remember the deferred promise as this only resolves after all responses have been received
			const devicesPromise = tradfri.observeDevices();

			fakeCoap.observe.should.have.been.calledOnce;
			fakeCoap.observe.should.have.been.calledWith(devicesUrl);

			fakeCoap.observe.resetHistory();

			const devices = [65536, 65537];
			await callbacks.observeDevices(createResponse(devices));

			fakeCoap.observe.should.have.been.calledTwice;
			fakeCoap.observe.should.have.been.calledWith(`${devicesUrl}/65536`);
			fakeCoap.observe.should.have.been.calledWith(`${devicesUrl}/65537`);

			// we intercepted the device_callback, so we need to manually call it
			// now for the following tests to work
			await callbacks.observeDevice[65536](createEmptyAccessoryResponse(65536));
			await callbacks.observeDevice[65537](createEmptyAccessoryResponse(65537));

			// now the deferred promise should have resolved
			await devicesPromise;
		});

		it("when a device is added, it should only call observe for that one", async () => {
			const devices = [65536, 65537, 65538];
			await callbacks.observeDevices(createResponse(devices));

			fakeCoap.observe.should.have.been.calledOnce;
			fakeCoap.observe.should.have.been.calledWith(`${devicesUrl}/65538`);

			// we intercepted the device_callback, so we need to manually call it
			// now for the following tests to work
			await callbacks.observeDevice[65538](createEmptyAccessoryResponse(65538));
		});

		it(`when a device is removed, on("device removed") should be called with its id`, async () => {

			const leSpy = spy();
			tradfri.on("device removed", leSpy);

			const devices = [65537, 65538];
			await callbacks.observeDevices(createResponse(devices));

			fakeCoap.observe.should.not.have.been.called;
			leSpy.should.have.been.calledOnce;
			leSpy.should.have.been.calledWithExactly(65536);

			tradfri.removeAllListeners();
		});

		for (const error of [
			MessageCodes.clientError.unauthorized,
			MessageCodes.clientError.forbidden,
			MessageCodes.clientError.notFound,
		]) {
			const code = error.toString();
			it(`when the server returns code "${code}" to observeDevices, only emit an error not "device removed"`, async () => {

				const removedSpy = spy();
				const errorSpy = spy();
				tradfri
					.on("device removed", removedSpy)
					.on("error", errorSpy)
					;

				await callbacks.observeDevices(createErrorResponse(error));

				fakeCoap.observe.should.not.have.been.called;
				removedSpy.should.not.have.been.called;
				errorSpy.should.have.been.calledOnce;
				expect(errorSpy.getCall(0).args[0]).to.be.an.instanceOf(Error);
				expect(errorSpy.getCall(0).args[0].message.startsWith("unexpected")).to.be.true;

				tradfri.removeAllListeners();
			});

			it(`when the server returns code "${code}" to observeDevice(instanceID), ${code === "4.04" ? "don't" : "only"} emit an error and don't emit "device removed"`, async () => {
				const updatedSpy = spy();
				const errorSpy = spy();
				tradfri
					.on("error", errorSpy)
					.on("device updated", updatedSpy)
					;

				// at this point we have devices 65537 and 65538. Fake an error to one of them
				await callbacks.observeDevice[65538](createErrorResponse(error));

				updatedSpy.should.not.have.been.called;
				if (code !== "4.04") {
					errorSpy.should.have.been.calledOnce;
					expect(errorSpy.getCall(0).args[0]).to.be.an.instanceOf(Error);
					expect(errorSpy.getCall(0).args[0].message.startsWith("unexpected")).to.be.true;
				} else {
					errorSpy.should.not.have.been.called;
				}

				tradfri.removeAllListeners();
			});
		}


	});

	describe("stopObservingDevices => ", () => {
		it("should call coap.stopObserving for each observed device and the device endpoint", () => {
			tradfri.stopObservingDevices();

			fakeCoap.stopObserving.should.have.been.calledThrice;
			fakeCoap.stopObserving.should.have.been.calledWith(`${devicesUrl}`);
			fakeCoap.stopObserving.should.have.been.calledWith(`${devicesUrl}/65537`);
			fakeCoap.stopObserving.should.have.been.calledWith(`${devicesUrl}/65538`);
		});
	});

});

describe("tradfri-client => updating resources => ", () => {

	// Setup a fresh mock
	const {
		tradfri,
		devicesUrl,
		fakeCoap,
		callbacks,
		createStubs,
		restoreStubs,
		resetStubHistory,
	} = createNetworkMock();
	before(createStubs);
	after(restoreStubs);
	afterEach(resetStubHistory);

	let lightAccessory: Accessory;
	let light: Light;

	async function resetDeviceInfrastructure() {
		tradfri.reset();
		tradfri.removeAllListeners();

		const lightPromise = createDeferredPromise<Accessory>();
		tradfri.on("device updated", acc => {
			if (acc.instanceId === 65536) lightPromise.resolve(acc);
		});

		// remember the deferred promise as this only resolves after all responses have been received
		const devicesPromise = tradfri.observeDevices();

		await callbacks.observeDevices(createResponse([65536]));
		await callbacks.observeDevice[65536](createResponse(createRGBBulb(65536)));

		// now the deferred promise should have resolved
		await devicesPromise;
		// wait for the light response too
		lightAccessory = await lightPromise;
		light = lightAccessory.lightList[0];
	}

	describe("updateResource => ", () => {

		beforeEach(resetDeviceInfrastructure);

		it("calling it with an unchanged resource should NOT call coap.request", async () => {
			await tradfri.updateDevice(lightAccessory).should.become(false);
			fakeCoap.request.should.not.have.been.called;
		});

		it("calling it with a changed resource should call coap.request with a correct payload", async () => {
			light.onOff = false;
			await tradfri.updateDevice(lightAccessory).should.become(true);

			fakeCoap.request.should.have.been.calledOnce;
			const callArgs = fakeCoap.request.getCall(0).args;
			expect(callArgs[0]).to.be.a("string").and.to.satisfy((s: string) => s.endsWith("15001/65536"));
			expect(callArgs[1]).to.equal("put");
			assertPayload(callArgs[2], {
				3311: [{
					5850: 0,
					5712: 5,
				}],
			});
		});
	});

});

describe("tradfri-client => custom requests => ", () => {

	// Setup the mock
	const {
		tradfri,
		devicesUrl,
		fakeCoap,
		callbacks,
		createStubs,
		restoreStubs,
		resetStubHistory,
	} = createNetworkMock();
	before(createStubs);
	after(restoreStubs);
	afterEach(resetStubHistory);

	describe("request => ", () => {

		const path = "testpath";
		const method = "delete";
		const payload = { foo: "bar" };
		const responsePayload = { test: "blub" };
		const response = createResponse(responsePayload, MessageCodes.clientError.badOption);
		let actualResponse: {
			code: string,
			payload: any,
		};

		before(() => fakeCoap.request.returns(Promise.resolve(response)));
		after(() => fakeCoap.request.resetBehavior());

		it("should call coap.request with the payload converted to a JSON Buffer", async () => {
			await tradfri.request(path, method, payload).should.be.fulfilled.then(resp => {
				actualResponse = resp;
			});

			fakeCoap.request.should.have.been.calledOnce;
			fakeCoap.request.getCall(0).args[0].should.equal(`coaps://localhost:5684/${path}`);
			fakeCoap.request.getCall(0).args[1].should.equal(method);
			assertPayload(fakeCoap.request.getCall(0).args[2], payload);
		});

		it("should also work without a payload", async () => {
			await tradfri.request(path, method).should.be.fulfilled;

			fakeCoap.request.should.have.been.calledOnce;
			fakeCoap.request.getCall(0).args[0].should.equal(`coaps://localhost:5684/${path}`);
			fakeCoap.request.getCall(0).args[1].should.equal(method);
			expect(fakeCoap.request.getCall(0).args[2] === undefined).to.be.true;
		});

		it("the response should be passed through", () => {
			actualResponse.code.should.equal(response.code.toString());
			actualResponse.payload.should.deep.equal(responsePayload);
		});
	});
});
