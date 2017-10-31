// tslint:disable:no-unused-expression

import { assert, expect } from "chai";
import { spy, stub } from "sinon";

import { Accessory } from "./accessory";
import { TradfriObserver, TradfriObserverAPI } from "./tradfri-observer";

describe("lib/tradfri-observer => ", () => {

	const observer = new TradfriObserver();
	const api = observer.getAPI();

	it(`the API object has an "on" and "off" function`, () => {
		expect(Object.keys(api)).to.deep.equal(["on", "off"]);
	});

	const leSpy = spy();

	it(`after adding a listener with "on", it gets called on "raise"`, () => {
		api.on("device updated", leSpy);
		const device = new Accessory();
		observer.raise("device updated", device);
		assert(leSpy.calledOnce);
		expect(leSpy.getCall(0).args[0]).to.equal(device);
		leSpy.reset();
	});

	it(`after removing a listener with "off", doesn't get called anymore`, () => {
		api.off("device updated", leSpy);
		observer.raise("device updated", null);
		assert(leSpy.notCalled);
	});

	it(`adding multiple listeners results in all of them being called`, () => {
		api.on("device updated", leSpy);
		api.on("device updated", leSpy);
		api.on("device updated", leSpy);

		observer.raise("device updated", null);
		assert(leSpy.calledThrice);
		leSpy.reset();
	});

	it(`calling "off" without a callback results in all being removed`, () => {
		api.off("device updated");
		observer.raise("device updated", null);
		assert(leSpy.notCalled);
	});

	it(`removing a listener twice works without errors`, () => {
		api.on("device updated", leSpy);
		api.off("device updated", leSpy);
		api.off("device updated", leSpy);
	});

	it(`calling getAPI twice returns the same object`, () => {
		expect(observer.getAPI()).to.equal(api);
	});

});
