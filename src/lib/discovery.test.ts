// tslint:disable:no-console
// tslint:disable:no-unused-expression
// tslint:disable:variable-name

import { assert, expect, should, use } from "chai";
import { SinonFakeTimers, spy, stub, useFakeTimers } from "sinon";
import * as sinonChai from "sinon-chai";

// enable the should interface with sinon
should();
use(sinonChai);

let findOneCalled: DeferredPromise<void>;
let findOneCallback: (service: any) => void;
const fakeBrowser = {
	start: stub(),
	stop: stub(),
};
const fakeBonjour = {
	findOne: stub()
		// remember the given callback
		.callsFake((opts, cb) => {
			findOneCallback = cb;
			if (findOneCalled != null) findOneCalled.resolve();
			return fakeBrowser;
		}),
};
const fakeBonjourPackage = stub().returns(fakeBonjour);

// stub out the bonjour package for discovery
import * as proxyquire from "proxyquire";
import { createDeferredPromise, DeferredPromise } from "./defer-promise";
import { wait } from "./promises";
const { discoverGateway, DiscoveredGateway } = proxyquire("./discovery", {
	bonjour: fakeBonjourPackage,
});

describe("lib/discovery => ", () => {

	let clock: SinonFakeTimers;
	beforeEach(() => {
		clock = useFakeTimers();
	});

	afterEach(() => {
		fakeBonjourPackage.resetHistory();
		fakeBonjour.findOne.resetHistory();
		fakeBrowser.start.resetHistory();
		fakeBrowser.stop.resetHistory();

		clock.restore();
	});

	it("discoverGateway lazily creates a bonjour instance", () => {
		discoverGateway(false);
		fakeBonjourPackage.should.have.been.calledOnce;
		discoverGateway(false);
		fakeBonjourPackage.should.have.been.calledOnce;
	});

	it("discoverGateway creates an mDNS browser and starts the discovery", () => {
		discoverGateway(false);
		fakeBonjour.findOne.should.have.been.calledOnce;
		fakeBrowser.start.should.have.been.calledOnce;
	});

	it("without a service response, discoverGateway() should fulfill with null after the default timeout has elapsed", (done) => {
		const timeout = 10000;

		const leSpy = spy();
		discoverGateway().then(leSpy);
		wait(timeout - 1).then(() => {
			leSpy.should.not.have.been.called;
			wait(1).then(() => {
				leSpy.should.have.been.calledWith(null);
				done();
			});
			clock.tick(1);
		});
		clock.tick(timeout - 1);
	});

	it("without a service response, discoverGateway(timeout) should fulfill with null after the passed timeout has elapsed", (done) => {
		const timeout = 5000;

		const leSpy = spy();
		discoverGateway(timeout).then(leSpy);
		wait(timeout - 1).then(() => {
			leSpy.should.not.have.been.called;
			wait(1).then(() => {
				leSpy.should.have.been.calledWith(null);
				done();
			});
			clock.tick(1);
		});
		clock.tick(timeout - 1);
	});

	it("without a service response, discoverGateway should never fulfill with the timeout disabled", (done) => {
		const spy1 = spy();
		const spy2 = spy();
		const oneDay = 1000 * 3600 * 24;

		discoverGateway(false).then(spy1);
		wait(oneDay).then(() => {
			spy1.should.not.have.been.called;

			discoverGateway(-1).then(spy2);
			wait(oneDay).then(() => {
				spy2.should.not.have.been.called;
				done();
			});
			clock.tick(oneDay);
		});
		clock.tick(oneDay);
	});

	it("discoverGateway should check the received responses if they represent a tradfri gateway", (done) => {
		const leSpy = spy();
		findOneCalled = createDeferredPromise();
		const retVal = discoverGateway(false);
		retVal.then(leSpy);

		// wait until we have a findOne callback
		findOneCalled.then(() => {
			// no service response
			findOneCallback(null);
			leSpy.should.not.have.been.called;

			// service response without txt property
			findOneCallback({});
			leSpy.should.not.have.been.called;

			// service response without name property
			findOneCallback({ txt: "foo" });
			leSpy.should.not.have.been.called;

			// service response with wrong name property
			findOneCallback({ txt: "foo", name: "wrong" });
			leSpy.should.not.have.been.called;

			// correct service response
			findOneCallback({
				name: "gw-abcdef123456",
				host: "TRADFRI-Gateway-abcdef123456.local",
				txt: { version: "1.2.3" },
				addresses: ["localhost"],
			});
			retVal.should.become({
				name: "gw-abcdef123456",
				host: "TRADFRI-Gateway-abcdef123456.local",
				version: "1.2.3",
				addresses: ["localhost"],
			}).then(() => done());
		});
	});

});
