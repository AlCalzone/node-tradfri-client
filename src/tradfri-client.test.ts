// tslint:disable:no-console
// tslint:disable:no-unused-expression
// tslint:disable:variable-name

import { assert, expect, should, use } from "chai";
import { CoapClient as coap, CoapResponse } from "node-coap-client";
import { SinonFakeTimers, spy, stub, useFakeTimers } from "sinon";
import * as sinonChai from "sinon-chai";
import "./"; // dummy-import so index.ts is covered
import { TradfriClient } from "./tradfri-client";

import { ContentFormats } from "node-coap-client/build/ContentFormats";
import { MessageCode, MessageCodes } from "node-coap-client/build/Message";
import { createEmptyAccessoryResponse, createErrorResponse, createNetworkMock, createResponse, createRGBBulb } from "../test/mocks";
import { Accessory, AccessoryTypes, Light, TradfriError, TradfriErrorCodes } from "./";
import { createDeferredPromise, DeferredPromise } from "./lib/defer-promise";
import { padStart } from "./lib/strings";

// enable the should interface with sinon
should();
// improve stubs for testing
use(sinonChai);

function assertPayload(actual: any, expected: {}) {
	expect(actual).to.be.an.instanceof(Buffer);
	expect(JSON.parse(actual.toString())).to.deep.equal(expected);
}

describe("tradfri-client => infrastructure => ", () => {

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

		it("should reset the CoAP client, provide new security params and resolve with true on success", async () => {
			fakeCoap.tryToConnect.returns(Promise.resolve(true));
			await tradfri.connect(identity, psk).should.become(true);

			fakeCoap.reset.should.have.been.called;
			fakeCoap.setSecurityParams.should.have.been.called;
			fakeCoap.setSecurityParams.getCall(0).args[1].should.deep.equal({
				psk: { [identity]: psk },
			});
			fakeCoap.tryToConnect.should.have.been.called;

			fakeCoap.tryToConnect.resetBehavior();
		});

		it("should reject with a `TradfriError` with code ConnectionTimedOut when the connection times out", async () => {
			fakeCoap.tryToConnect.returns(Promise.resolve("timeout"));
			await tradfri.connect(identity, psk).should.be.rejected.then(err => {
				expect(err).to.be.an.instanceof(TradfriError);
				expect(err.code).to.equal(TradfriErrorCodes.ConnectionTimedOut);
			});
			fakeCoap.tryToConnect.resetBehavior();
		});

		it("should reject with a `TradfriError` with code AuthenticationFailed when the credentials are wrong", async () => {
			fakeCoap.tryToConnect.returns(Promise.resolve("auth failed"));
			await tradfri.connect(identity, psk).should.be.rejected.then(err => {
				expect(err).to.be.an.instanceof(TradfriError);
				expect(err.code).to.equal(TradfriErrorCodes.AuthenticationFailed);
			});
			fakeCoap.tryToConnect.resetBehavior();
		});

		it("should reject with a `TradfriError` with code ConnectionFailed when some other error happens", async () => {
			fakeCoap.tryToConnect.returns(Promise.resolve("error"));
			await tradfri.connect(identity, psk).should.be.rejected.then(err => {
				expect(err).to.be.an.instanceof(TradfriError);
				expect(err.code).to.equal(TradfriErrorCodes.ConnectionFailed);
			});
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

		it("should reject with a `TradfriError` with code ConnectionTimedOut when the authentication times out", async () => {
			fakeCoap.tryToConnect.returns(Promise.resolve("timeout"));
			await tradfri.authenticate(dummyIdentity).should.be.rejected.then(err => {
				expect(err).to.be.an.instanceof(TradfriError);
				expect(err.code).to.equal(TradfriErrorCodes.ConnectionTimedOut);
			});
			fakeCoap.tryToConnect.resetBehavior();
		});

		it("should reject with a `TradfriError` with code AuthenticationFailed when the security code was wrong", async () => {
			fakeCoap.tryToConnect.returns(Promise.resolve("auth failed"));
			await tradfri.authenticate(dummyIdentity).should.be.rejected.then(err => {
				expect(err).to.be.an.instanceof(TradfriError);
				expect(err.code).to.equal(TradfriErrorCodes.AuthenticationFailed);
			});
			fakeCoap.tryToConnect.resetBehavior();
		});

		it("should reject with a `TradfriError` with code ConnectionFailed when some other error happens", async () => {
			fakeCoap.tryToConnect.returns(Promise.resolve("error"));
			await tradfri.authenticate(dummyIdentity).should.be.rejected.then(err => {
				expect(err).to.be.an.instanceof(TradfriError);
				expect(err.code).to.equal(TradfriErrorCodes.ConnectionFailed);
			});
			fakeCoap.tryToConnect.resetBehavior();
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

	describe("ping =>", () => {
		it("should call coap.ping for the coap host", () => {
			tradfri.ping();
			fakeCoap.ping.should.have.been.called;
		});

		it("should pass the correct arguments", () => {
			tradfri.ping();
			fakeCoap.ping.should.have.been.calledWithExactly("coaps://localhost:5684/", undefined);
			fakeCoap.ping.resetHistory();

			tradfri.ping(500);
			fakeCoap.ping.should.have.been.calledWithExactly("coaps://localhost:5684/", 500);
			fakeCoap.ping.resetHistory();
		});

		it("should pass through the returned promise", async () => {
			fakeCoap.ping.returns(Promise.resolve(true));
			await tradfri.ping().should.become(true);

			fakeCoap.ping.returns(Promise.resolve(false));
			await tradfri.ping().should.become(false);

			fakeCoap.ping.resetBehavior();
		});
	});

});

describe("tradfri-client => retrying the connection => ", () => {
	let clock: SinonFakeTimers;

	beforeEach(() => clock = useFakeTimers());
	afterEach(() => clock.restore());

	// Setup the mock
	const {
		tradfri,
		devicesUrl,
		fakeCoap,
		callbacks,
		createStubs,
		restoreStubs,
		resetStubHistory,
	} = createNetworkMock(undefined, {
		watchConnection: {
			connectionInterval: 1000,
			maximumConnectionAttempts: 3,
		},
	});
	before(createStubs);
	after(restoreStubs);
	afterEach(resetStubHistory);

	let connectionFailedPromise: DeferredPromise<void>;
	// async hacked version of clock.runAll that waits for the async method to complete aswell
	async function runAllAsync() {
		clock.runAll();
		connectionFailedPromise = createDeferredPromise();
		await connectionFailedPromise;
		connectionFailedPromise = null;
	}
	tradfri.on("connection failed", () => connectionFailedPromise && connectionFailedPromise.resolve());

	it("should retry the connection as many times as configured and then reject", async () => {
		fakeCoap.tryToConnect.returns("timeout");

		// set up spies
		const failedSpy = spy();
		tradfri.on("connection failed", failedSpy);
		const connectionPromise = tradfri.connect("foo", "bar");
		// we configured 3 tries, so advance the timer thrice
		for (let i = 1; i <= 3; i++) {
			await runAllAsync();
			failedSpy.should.have.been.calledWith(i, 3);
		}

		await expect(connectionPromise).to.be.rejectedWith("did not respond");

		// back to square one
		tradfri.removeListener("connection failed", failedSpy);
		fakeCoap.tryToConnect.resetBehavior();
	});

	it("should work when any of the connection attempts succeeds", async () => {
		fakeCoap.tryToConnect
			.onFirstCall().returns("timeout")
			.onSecondCall().returns("timeout")
		;
		fakeCoap.tryToConnect.returns(true);

		const connectionPromise = tradfri.connect("foo", "bar");
		// the first 2 attempts will be retried, so advance the timer twice
		for (let i = 1; i <= 2; i++) {
			await runAllAsync();
		}
		// now synchronously run the suceeding timer
		clock.runAll();
		await expect(connectionPromise).to.become(true);

		// back to square one
		fakeCoap.tryToConnect.resetBehavior();
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

		it("calling it again with similar paths pointing to the same resource should also not call coap.observe", async () => {
			const cb = spy();
			await Promise.all(
				[
					"coaps://localhost:5684/15001",
					"coaps://localhost:5684/15001/",
					"/15001",
					"/15001/",
					"15001/",
				].map(path => tradfri.observeResource(path, cb)),
			);
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

	describe("observeDevices (with errors) => ", () => {
		it("should be rejected when one of the device callbacks receives an invalid response", async () => {

			// the error spy has to be used our chai fails our test
			const errorSpy = spy();
			tradfri.on("error", errorSpy);

			const devicesPromise = tradfri.observeDevices();
			const devices = [65536];
			await callbacks.observeDevices(createResponse(devices));

			// we intercepted the device_callback, so we need to manually call it
			// now for the following tests to work
			await callbacks.observeDevice[65536](createErrorResponse(MessageCodes.clientError.forbidden));

			errorSpy.should.have.been.called;
			tradfri.removeAllListeners();

			// now the deferred promise should have been rejected
			await devicesPromise.should.be.rejectedWith("could not be observed");
		});
	});

});

describe("tradfri-client => fixing properties => ", () => {

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

	it("when the gateway reports minimum brightness on a turned-off light, set it to zero instead", async () => {
		// remember the deferred promise as this only resolves after all responses have been received
		const devicesPromise = tradfri.observeDevices();
		let theLight: Light;
		tradfri.on("device updated", (acc) => theLight = acc.lightList[0]);

		const devices = [65536];
		await callbacks.observeDevices(createResponse(devices));

		const respAccessory = createRGBBulb(65536);
		respAccessory["3311"][0]["5850"] = 0;
		respAccessory["3311"][0]["5851"] = 1;
		await callbacks.observeDevice[65536](createResponse(respAccessory));

		// now the deferred promise should have resolved
		await devicesPromise;

		theLight.onOff.should.equal(false);
		theLight.dimmer.should.equal(0);

		tradfri.removeAllListeners();
	});

	it("when the gateway reports some other brightness on a turned-off light, keep it as-is", async () => {
		// remember the deferred promise as this only resolves after all responses have been received
		let theLight: Light;
		const lightUpdatedPromise = createDeferredPromise();
		tradfri.on("device updated", (acc) => {
			theLight = acc.lightList[0];
			lightUpdatedPromise.resolve();
		});

		const respAccessory = createRGBBulb(65536);
		respAccessory["3311"][0]["5850"] = 0;
		respAccessory["3311"][0]["5851"] = 2;
		await callbacks.observeDevice[65536](createResponse(respAccessory));

		// now the deferred promise should have resolved
		await lightUpdatedPromise;

		theLight.onOff.should.equal(false);
		theLight.dimmer.should.not.equal(0);

		tradfri.removeAllListeners();
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

	describe("updateDevice => ", () => {

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

		it("calling it with a non-observed device should throw", () => {
			const nonExisting = lightAccessory.clone();
			nonExisting.instanceId = 12345;
			expect(() => tradfri.updateDevice(nonExisting)).to.throw("is not known");
		});
	});

	describe("operateLight => ", () => {
		it("should throw when called with a non-light accessory", () => {
			const notALight = new Accessory();
			notALight.type = AccessoryTypes.remote;
			expect(() => tradfri.operateLight(notALight, {})).to.throw("must be a lightbulb");
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

		it("responses with content-format 0 or without one should be parsed as a string", async () => {
			const expected = "HALLO";
			const stringResponse = createResponse(expected, undefined, ContentFormats.text_plain);

			fakeCoap.request.returns(Promise.resolve(stringResponse));
			await tradfri.request(null, null).should.be.fulfilled.then(
				resp => expect(resp.payload).to.be.a("string").and.equal(expected),
			);

			stringResponse.format = null;
			fakeCoap.request.returns(Promise.resolve(stringResponse));
			await tradfri.request(null, null).should.be.fulfilled.then(
				resp => expect(resp.payload).to.be.a("string").and.equal(expected),
			);

			fakeCoap.request.resetBehavior();
		});

		it("responses with any other content format should pass the raw Buffer through", async () => {
			for (const contentFormat of [
				ContentFormats.application_octetStream,
				ContentFormats.application_exi,
				ContentFormats.application_linkFormat,
				ContentFormats.application_xml,
			]) {
				const expected = Buffer.from("unknown");
				const jsonResponse = createResponse(expected, undefined, ContentFormats.application_octetStream);

				fakeCoap.request.returns(Promise.resolve(jsonResponse));
				await tradfri.request(null, null).should.be.fulfilled.then(
					resp => expect(resp.payload).to.be.an.instanceof(Buffer)
						.and.deep.equal(expected),
				);

				fakeCoap.request.resetBehavior();
			}
		});

		it("when the coap client is reset during a pending request, the rejection should be turned into an error event", (done) => {
			fakeCoap.request.returns(Promise.reject(new Error("CoapClient was reset")));

			tradfri.on("error", err => {
				err.should.be.an.instanceof(TradfriError);
				(err as TradfriError).code.should.equal(TradfriErrorCodes.NetworkReset);

				tradfri.removeAllListeners();
				fakeCoap.request.resetBehavior();
				done();
			});

			tradfri.request(null, null);
		});

		it("when the DTLS handshake times out during a pending request, the rejection should be turned into an error event", (done) => {
			fakeCoap.request.returns(Promise.reject(new Error("The DTLS handshake timed out")));

			tradfri.on("error", err => {
				err.should.be.an.instanceof(TradfriError);
				(err as TradfriError).code.should.equal(TradfriErrorCodes.ConnectionTimedOut);

				tradfri.removeAllListeners();
				fakeCoap.request.resetBehavior();
				done();
			});

			tradfri.request(null, null);
		});
	});
});
