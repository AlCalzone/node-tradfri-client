// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

import { expect } from "chai";
import * as sinon from "sinon";
import { IPSOObject } from "./ipsoObject";
// tslint:disable:no-unused-expression

// most of the class is already tested through derived classes
// so we test the proxy functions here
describe("ipso/ipsoObject => proxies", () => {

	const obj = new IPSOObject();
	let proxy = obj.createProxy();
	const unproxied = proxy.unproxy();

	it("isProxy should be false for native objects", () => {
		expect(obj.isProxy).to.be.false;
	});
	it("isProxy should be true for proxied objects", () => {
		expect(proxy.isProxy).to.be.true;
	});
	it("isProxy should be true for unproxied objects", () => {
		expect(unproxied.isProxy).to.be.false;
	});

	it("unproxying a non-proxy object should work (but not do anything)", () => {
		const stillNotAProxy = unproxied.unproxy();
		expect(stillNotAProxy.isProxy).to.be.false;
		// equality check for proxies is pointless, but whatever...
		expect(unproxied).to.equal(stillNotAProxy);
		expect(unproxied).to.deep.equal(stillNotAProxy);
	});

	it("serialize() should return an empty object for IPSOObject", () => {
		expect(obj.serialize()).to.deep.equal({});
	});

	it(`serialize() should transparently work for proxied objects`, () => {
		expect(proxy.serialize()).to.deep.equal({});
	});

	it(`clone() on a native object should return another native object`, () => {
		expect(obj.clone().isProxy).to.be.false;
	});
	it(`clone() on a proxy should return another proxy`, () => {
		expect(proxy.clone().isProxy).to.be.true;
	});

	it(`serialize() should cause the proxy to be queried only once for "serialize"`, () => {
		const dummyGet = (me, prop) => {
			return me[prop];
		};
		const spy = sinon.spy(dummyGet);
		proxy = obj.createProxy(spy);
		proxy.serialize();
		expect(spy.calledOnce).to.be.true;
		expect(spy.getCall(0).args[1]).to.equal("serialize");
	});

});

// nothing special to test for with serialization, e.g. no required properties
