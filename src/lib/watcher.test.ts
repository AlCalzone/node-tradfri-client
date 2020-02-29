// tslint:disable:no-console
// tslint:disable:no-unused-expression
// tslint:disable:variable-name

import { assert, expect } from "chai";
import { SinonFakeTimers, spy, stub, useFakeTimers } from "sinon";

import { createDeferredPromise, DeferredPromise } from "alcalzone-shared/deferred-promise";
import { CoapClient as coap, CoapResponse } from "node-coap-client";
import { createNetworkMock } from "../../test/mocks";
import { TradfriClient } from "../tradfri-client";
import { ConnectionWatcher, ConnectionWatcherOptions } from "./watcher";

describe.skip("connection watching => ", () => {

	let clock: SinonFakeTimers;

	beforeEach(() => {
		clock = useFakeTimers();
	});
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
	} = createNetworkMock();
	before(createStubs);
	after(restoreStubs);
	afterEach(resetStubHistory);

	it("the watcher constructor should throw on invalid arguments", () => {
		function construct(options?: Partial<ConnectionWatcherOptions>) {
			return new ConnectionWatcher(null, options);
		}

		const throwingOptions: Partial<ConnectionWatcherOptions>[] = [
			{pingInterval: 0}, {pingInterval: 1_000_000},
			{failedPingBackoffFactor: 0.9}, {failedPingBackoffFactor: 10},
			{failedPingCountUntilOffline: 0}, {failedPingCountUntilOffline: 100},
			{offlinePingCountUntilReconnect: 0}, {offlinePingCountUntilReconnect: 100},
			{maximumReconnects: 0},
			{connectionInterval: 0}, {connectionInterval: 1_000_000},
			{failedConnectionBackoffFactor: 0.9}, {failedConnectionBackoffFactor: 10},
			{maximumConnectionAttempts: 0},
		];
		for (const opt of throwingOptions) {
			const prop = Object.keys(opt)[0];
			expect(() => construct(opt)).to.throw(Error, null, `calling the constructor with ${prop}=${opt[prop]} did not throw!`);
		}

		// defaults shouldn't throw
		expect(() => construct()).to.not.throw();
	});

	let pingPromise: DeferredPromise<void>;
	let watcher: ConnectionWatcher;
	function createWatcher(options: Partial<ConnectionWatcherOptions>) {
		watcher = new ConnectionWatcher(tradfri, options);
		watcher
			// we need this little hack, because the watcher internally uses await,
			// so the callback returns before the method has completed
			.on("ping succeeded", () => pingPromise && pingPromise.resolve())
			.on("ping failed", () => pingPromise && pingPromise.resolve())
		;
	}
	createWatcher({
		pingInterval: 1000,
	});

	// async hacked version of clock.runAll that waits for the async method to complete aswell
	async function runAllAsync() {
		clock.runAll();
		pingPromise = createDeferredPromise();
		await pingPromise;
		pingPromise = null;
	}

	it("should throw when trying to start it twice", () => {
		watcher.start();
		expect(() => watcher.start()).to.throw();
		// stop it, so we can start again in the next test
		watcher.stop();
	});

	it("should NOT throw when trying to stop it twice", () => {
		watcher.start();
		watcher.stop();
		expect(() => watcher.stop()).to.not.throw();
	});

	it("after starting it, it should regularly call tradfri.ping() until it's stopped", async () => {
		fakeCoap.ping.returns(Promise.resolve(true));

		watcher.start();
		// 5 times should be enough
		const times = 5;
		for (let i = 1; i <= times; i++) {
			// run the timeouts
			await runAllAsync();
			fakeCoap.ping.callCount.should.equal(i);
		}
		// tick half an interval to make sure the next timer is already scheduled
		clock.tick(500);
		watcher.stop();
		fakeCoap.ping.resetHistory();
		clock.runAll(); // use sync version as we expect the async method to not be called
		fakeCoap.ping.should.not.have.been.called;

		fakeCoap.ping.resetBehavior();
	});

	it(`when the ping succeeds, emit the "ping succeeded" event`, async () => {
		fakeCoap.ping.returns(Promise.resolve(true));

		// set up spies
		const successSpy = spy();
		const failedSpy = spy();
		watcher
			.once("ping succeeded", successSpy)
			.once("ping failed", failedSpy)
			.start()
		;
		// run the timeouts
		await runAllAsync();

		// evaluate it
		successSpy.should.have.been.called;
		failedSpy.should.not.have.been.called;

		// back to square one
		watcher
			.removeListener("ping succeeded", successSpy)
			.removeListener("ping failed", failedSpy)
			.stop()
		;
		fakeCoap.ping.resetBehavior();
	});

	it(`when the ping fails, emit the "ping failed" event. this must include the failed ping count`, async () => {
		fakeCoap.ping.returns(false);

		// set up spies
		const successSpy = spy();
		const failedSpy = spy();
		watcher
			.on("ping succeeded", successSpy)
			.on("ping failed", failedSpy)
			.start()
		;
		// 5 times should be enough
		const times = 5;
		for (let i = 1; i <= times; i++) {
			// run the timeouts
			await runAllAsync();
			failedSpy.callCount.should.equal(i);
			failedSpy.getCall(i - 1).args.should.deep.equal([i]);
		}
		successSpy.should.not.have.been.called;

		// back to square one
		watcher
			.removeListener("ping succeeded", successSpy)
			.removeListener("ping failed", failedSpy)
			.stop()
		;
		fakeCoap.ping.resetBehavior();
	});

	it(`the failed ping count should be reset on success`, async () => {
		fakeCoap.ping
			.onFirstCall().returns(true)
			.onSecondCall().returns(false)
			.onThirdCall().returns(true)
		;
		fakeCoap.ping.returns(false);

		// set up spies
		const failedSpy = spy();
		watcher
			.on("ping failed", failedSpy)
			.start()
		;
		// 5 times should be enough
		const times = 5;
		for (let i = 1; i <= times; i++) {
			// run the timeouts
			await runAllAsync();
		}
		failedSpy.callCount.should.equal(3);
		failedSpy.getCalls().map(call => call.args[0]).should.deep.equal([1, 1, 2]);

		// back to square one
		watcher
			.removeListener("ping failed", failedSpy)
			.stop()
		;
		fakeCoap.ping.resetBehavior();
	});

	it(`when the ping fails for the first time after succeeding, emit the "connection lost" event`, async () => {
		fakeCoap.ping
			.onFirstCall().returns(true)
			.onSecondCall().returns(true)
		;
		fakeCoap.ping.returns(false);

		// set up spies
		const leSpy = spy();
		watcher
			.on("connection lost", leSpy)
			.start()
		;
		// execute a number of pings
		for (let i = 0; i < 5; i++) {
			await runAllAsync();
		}

		// evaluate it
		leSpy.should.have.been.calledOnce;

		// back to square one
		watcher
			.removeAllListeners("connection lost")
			.stop()
		;
		fakeCoap.ping.resetBehavior();
	});

	it(`when the ping succeeds for the first time after failing, emit the "connection alive" event`, async () => {
		fakeCoap.ping
			.onFirstCall().returns(false)
			.onSecondCall().returns(false)
		;
		fakeCoap.ping.returns(true);

		// set up spies
		const leSpy = spy();
		watcher
			.on("connection alive", leSpy)
			.start()
		;
		// execute a number of pings
		for (let i = 0; i < 5; i++) {
			await runAllAsync();
		}

		// evaluate it
		leSpy.should.have.been.calledOnce;

		// back to square one
		watcher
			.removeAllListeners("connection alive")
			.stop()
		;
		fakeCoap.ping.resetBehavior();
	});

	it(`when the failed ping count surpasses the offline threshold, emit the "gateway offline" event`, async () => {
		// create a new watcher, so we know how many pings to expect
		createWatcher({
			pingInterval: 1000,
			failedPingCountUntilOffline: 4,
		});

		fakeCoap.ping
			.onFirstCall().returns(true)
		;
		fakeCoap.ping.returns(false);

		// set up spies
		const leSpy = spy();
		watcher
			.on("gateway offline", leSpy)
			.start()
		;
		// execute a number of pings
		for (let i = 1; i <= 10; i++) {
			await runAllAsync();
			if (i < 5) leSpy.callCount.should.equal(0, `event was emitted on ping #${i}`);
			if (i === 5) leSpy.should.have.been.called;
		}

		// back to square one
		watcher
			.removeAllListeners("gateway offline")
			.stop()
		;
		fakeCoap.ping.resetBehavior();
	});

	it(`reconnecting should happen on the correct # of pings`, async () => {

		// create a new watcher, so we know how many pings to expect
		createWatcher({
			pingInterval: 1000,
			failedPingCountUntilOffline: 3,
			offlinePingCountUntilReconnect: 2,
			maximumReconnects: 3,
		});

		fakeCoap.ping
			.onFirstCall().returns(true)
		;
		fakeCoap.ping.returns(false);

		// set up spies
		const reconnectSpy = spy();
		const giveupSpy = spy();
		watcher
			.on("reconnecting", reconnectSpy)
			.on("give up", giveupSpy)
			.start()
		;
		// execute a number of pings
		// reconnects should happen on ping #5, #7, #9
		// giving up should happen on ping #11
		for (let i = 1; i <= 13; i++) {
			await runAllAsync();
			if (i < 5) {
				reconnectSpy.should.not.have.been.called;
				giveupSpy.should.not.have.been.called;
				fakeCoap.reset.should.not.have.been.called;
			} else if (i < 7) {
				reconnectSpy.should.have.been.calledWith(1, 3);
				giveupSpy.should.not.have.been.called;
				fakeCoap.reset.should.have.been.calledOnce;
			} else if (i < 9) {
				reconnectSpy.should.have.been.calledWith(2, 3);
				giveupSpy.should.not.have.been.called;
				fakeCoap.reset.should.have.been.calledTwice;
			} else if (i < 11) {
				reconnectSpy.should.have.been.calledWith(3, 3);
				giveupSpy.should.not.have.been.called;
				fakeCoap.reset.should.have.been.calledThrice;
			} else {
				reconnectSpy.should.have.been.calledThrice;
				giveupSpy.should.have.been.calledOnce;
				fakeCoap.reset.should.have.been.calledThrice;
			}
		}

		// back to square one
		watcher
			.removeAllListeners("reconnecting")
			.removeAllListeners("give up")
			.stop()
		;
		fakeCoap.ping.resetBehavior();
	});

	it(`when reconnection is disabled, "reconnecting" and "give up" should never be emitted`, async () => {
		// create a new watcher, so we know how many pings to expect
		createWatcher({
			pingInterval: 1000,
			failedPingCountUntilOffline: 1,
			reconnectionEnabled: false,
			offlinePingCountUntilReconnect: 3,
			maximumReconnects: 3,
		});

		fakeCoap.ping
			.onFirstCall().returns(true)
		;
		fakeCoap.ping.returns(false);

		// set up spies
		const reconnectSpy = spy();
		const giveupSpy = spy();
		watcher
			.on("reconnecting", reconnectSpy)
			.on("give up", giveupSpy)
			.start()
		;
		// execute a large number of pings
		for (let i = 1; i < 100; i++) {
			await runAllAsync();
		}

		// evaluate
		reconnectSpy.should.not.have.been.called;
		giveupSpy.should.not.have.been.called;
		fakeCoap.reset.should.not.have.been.called;

		// back to square one
		watcher
			.removeAllListeners("reconnecting")
			.removeAllListeners("give up")
			.stop()
		;
		fakeCoap.ping.resetBehavior();
	});

	it(`when infinite reconnects are enabled, "give up" should never be emitted`, async () => {
		// create a new watcher, so we know how many pings to expect
		createWatcher({
			pingInterval: 1000,
			failedPingCountUntilOffline: 1,
			offlinePingCountUntilReconnect: 3,
		});

		fakeCoap.ping
			.onFirstCall().returns(true)
		;
		fakeCoap.ping.returns(false);

		// set up spies
		const reconnectSpy = spy();
		const giveupSpy = spy();
		watcher
			.on("reconnecting", reconnectSpy)
			.on("give up", giveupSpy)
			.start()
		;
		// execute a large number of pings
		for (let i = 1; i < 100; i++) {
			await runAllAsync();
			if (i < 4) reconnectSpy.should.not.have.been.called;
			if (i === 4) reconnectSpy.should.have.been.called;
		}

		// evaluate
		reconnectSpy.should.have.been.called;
		giveupSpy.should.not.have.been.called;

		// back to square one
		watcher
			.removeAllListeners("reconnecting")
			.removeAllListeners("give up")
			.stop()
		;
		fakeCoap.ping.resetBehavior();
	});

});
