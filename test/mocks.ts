// tslint:disable:no-console
// tslint:disable:no-unused-expression
// tslint:disable:variable-name

import { assert, expect, should, use } from "chai";
import { spy, stub } from "sinon";

import { CoapClient as coap, CoapResponse } from "node-coap-client";
import { ContentFormats } from "node-coap-client/build/ContentFormats";
import { MessageCode, MessageCodes } from "node-coap-client/build/Message";
import { Accessory, Light, TradfriClient } from "../src";

export function createResponse(
	payload: Buffer | string | any | null,
	code: MessageCode = MessageCodes.success.content,
	contentFormat: ContentFormats = ContentFormats.application_json,
): CoapResponse {
	if (!(payload instanceof Buffer)) {
		if (typeof payload !== "string" && typeof payload !== "undefined") {
			payload = JSON.stringify(payload);
		}
	}
	return {
		code,
		format: contentFormat,
		payload: payload != null ?
			payload instanceof Buffer ? payload :
				Buffer.from(payload, "utf8") : undefined,
	};
}
export function createErrorResponse(code: MessageCode = MessageCodes.clientError.notFound): CoapResponse {
	return {
		code,
		format: ContentFormats.text_plain,
		payload: null,
	};
}

/**
 * Creates a mock for the entire network and callback framework
 * @param hostname The (optional) hostname to use for the mock
 */
export function createNetworkMock(
	hostname: string = "localhost",
) {

	const tradfri = new TradfriClient(hostname);

	const devicesUrl = `coaps://${hostname}:5684/15001`;

	const fakeCoap = {
		observe: null as sinon.SinonStub,
		request: null as sinon.SinonStub,
		stopObserving: null as sinon.SinonStub,
		reset: null as sinon.SinonStub,
		setSecurityParams: null as sinon.SinonStub,
		tryToConnect: null as sinon.SinonStub,
		ping: null as sinon.SinonStub,
	};
	const callbacks = {
		observeDevices: null as (response: CoapResponse) => Promise<void>,
		observeDevice: {} as Record<string, (response: CoapResponse) => Promise<void>>,
	};
	const devices = new Map<number, Accessory>();

	/**
	 * Remembers a callback for later tests
	 */
	function rememberCallback(path: string, cb) {
		if (path === devicesUrl) {
			callbacks.observeDevices = cb;
		} else if (path.indexOf(devicesUrl) > -1) {
			const instanceId = path.substr(path.lastIndexOf("/") + 1);
			callbacks.observeDevice[instanceId] = cb;
		}
	}

	function createStubs() {
		// coap.observe should resolve
		fakeCoap.observe = stub(coap, "observe")
			.callsFake((path: string, method, cb) => {
				rememberCallback(path, cb);
				return Promise.resolve();
			});
		fakeCoap.request = stub(coap, "request");
		fakeCoap.stopObserving = stub(coap, "stopObserving");
		fakeCoap.reset = stub(coap, "reset");
		fakeCoap.setSecurityParams = stub(coap, "setSecurityParams");
		fakeCoap.tryToConnect = stub(coap, "tryToConnect");
		fakeCoap.ping = stub(coap, "ping");
	}

	function restoreStubs() {
		for (const method of Object.keys(fakeCoap)) {
			fakeCoap[method].restore();
		}
	}

	function resetStubHistory() {
		for (const method of Object.keys(fakeCoap)) {
			fakeCoap[method].resetHistory();
		}
	}

	return {
		tradfri,
		devicesUrl,
		fakeCoap,
		callbacks,
		createStubs,
		restoreStubs,
		resetStubHistory,
	};
}

export function createEmptyAccessory(instanceId: number = 65536) {
	const ret = new Accessory();
	ret.instanceId = instanceId;
	return ret.serialize();
}
export function createEmptyAccessoryResponse(instanceId?: number) {
	return createResponse(createEmptyAccessory(instanceId));
}

export function createEmptyLight(instanceId: number = 65536) {
	const ret = new Accessory();
	const light = new Light(null, ret);
	ret.instanceId = instanceId;
	ret.lightList = [light];
	return ret.serialize();
}
export function createEmptyLightResponse(instanceId?: number) {
	return createResponse(createEmptyLight(instanceId));
}

export function createRGBBulb(instanceId: number = 65536) {
	{
		return {
			3: {
				0: "IKEA of Sweden",
				1: "TRADFRI bulb E27 C/WS opal 600lm",
				2: "",
				3: "1.2.217",
				6: 1,
			},
			3311: [
				{
					5706: "010203",
					5707: 38079,
					5708: 43737,
					5709: 0,
					5710: 0,
					5711: 0,
					5850: 1,
					5851: 254,
					9003: 0,
				},
			],
			5750: 2,
			9001: "TRADFRI bulb E27 C/WS opal 600lm",
			9002: 1499440525,
			9003: instanceId,
			9019: 1,
			9020: 1507456927,
			9054: 0,
		};
	}
}

export function createWSBulb(instanceId: number = 65536) {
	{
		return {
			3: {
				0: "IKEA of Sweden",
				1: "TRADFRI bulb E27 WS clear 950lm",
				2: "",
				3: "1.2.217",
				6: 1,
			},
			3311: [
				{
					5706: "f5faf6",
					5707: 0,
					5708: 0,
					5709: 0,
					5710: 0,
					5711: 250,
					5850: 1,
					5851: 254,
					9003: 0,
				},
			],
			5750: 2,
			9001: "TRADFRI bulb E27 WS clear 950lm",
			9002: 1499440525,
			9003: instanceId,
			9019: 1,
			9020: 1507456927,
			9054: 0,
		};
	}
}
