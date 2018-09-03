// tslint:disable:no-console
// tslint:disable:no-unused-expression
// tslint:disable:variable-name

import { assert, expect } from "chai";
import { SinonFakeTimers, spy, stub, useFakeTimers } from "sinon";

import { wait } from "alcalzone-shared/async";

// create stubs
let fakeResponseHandler: (response: any) => void;
let fakeReadyHandler: () => void;
const fakeMDNSServer = {
	on: stub().callsFake((event, handler) => {
		if (event === "response") fakeResponseHandler = handler;
		if (event === "ready") fakeReadyHandler = handler;
	}),
	query: stub(),
	destroy: stub(),
	initServer: stub(),
};
const fakeMDNSPackage = stub().returns(fakeMDNSServer);

const fakeInterfaces = Object.freeze({
	// an internal interface with two addresses
	internal: [{
		address: "foo",
		internal: true,
	}, {
		address: "bar",
		internal: true,
	}],
	// an external interface with two addresses (IPv4 and v6)
	external: [{
		address: "1.2.3.4",
		internal: false,
		family: "IPv4",
	}, {
		address: "1:2:3::4",
		internal: false,
		family: "IPv6",
	}],
	// another external interface with two addresses
	external2: [{
		address: "4.3.2.1",
		internal: false,
		family: "IPv4",
	}, {
		address: "4:3:2::1",
		internal: false,
		family: "IPv6",
	}],
});
const fakeOS = {
	networkInterfaces: stub().returns(fakeInterfaces),
};
const IPv6MulticastAddress = "ff02::fb";

import * as proxyquireModule from "proxyquire";
const proxyquire = proxyquireModule.noPreserveCache();
const {
	discoverGateway,
	// tslint:disable-next-line:whitespace
} = proxyquire<typeof import("./discovery3")>("./discovery3", {
	"multicast-dns": fakeMDNSPackage,
	"os": fakeOS,
});

describe("lib/discovery3 => ", () => {

	let clock: SinonFakeTimers;
	beforeEach(() => {
		clock = useFakeTimers();
	});

	afterEach(() => {
		fakeMDNSPackage.resetHistory();
		fakeMDNSServer.on.resetHistory();
		fakeMDNSServer.query.resetHistory();
		fakeMDNSServer.destroy.resetHistory();

		fakeOS.networkInterfaces.resetHistory();

		clock.restore();
	});

	describe.only("discoverGateway() => ", () => {

		const coapDomain = "_coap._udp.local";
		const gatewayID = "123456abcdef";
		const completeDomain = `gw-${gatewayID}.${coapDomain}`;
		const hostname = `TRADFRI-Gateway-${gatewayID}.local`;

		// 1 for IPv4, and 1 per IPv6 interface (2)
		const expectedCallsPerDiscovery = 3;

		it("returns a Promise", () => {
			discoverGateway().should.be.an.instanceof(Promise);
		});

		it("should query the network interfaces", async () => {
			const promise = discoverGateway();
			clock.runAll();

			fakeOS.networkInterfaces.should.have.been.called;
		});

		it("should create an mdns instance for the IPv4-catchall address (0.0.0.0)", async () => {
			const promise = discoverGateway();
			clock.runAll();

			fakeMDNSPackage.should.have.been.calledWith({
				interface: "0.0.0.0",
				type: "udp4",
			});
		});

		it("should create an mdns instance for the IPv6 catchall address (::%<name>) of all non-internal interfaces", async () => {
			const promise = discoverGateway();
			clock.runAll();

			fakeMDNSPackage.should.have.been.calledWith({
				interface: "::%external",
				type: "udp6",
				ip: IPv6MulticastAddress,
			});
			fakeMDNSPackage.should.have.been.calledWith({
				interface: "::%external2",
				type: "udp6",
				ip: IPv6MulticastAddress,
			});
		});

		it("should create new mdns instances each call", async () => {
			let promise = discoverGateway();
			clock.runAll();
			fakeMDNSPackage.callCount.should.equal(expectedCallsPerDiscovery);

			promise = discoverGateway();
			clock.runAll();
			fakeMDNSPackage.callCount.should.equal(2 * expectedCallsPerDiscovery);

			promise = discoverGateway();
			clock.runAll();
			fakeMDNSPackage.callCount.should.equal(3 * expectedCallsPerDiscovery);
		});

		it("should register a response handler", async () => {
			const promise = discoverGateway();
			clock.runAll();
			fakeMDNSServer.on.should.have.been.calledWith("response");
		});

		it("should register a ready handler", async () => {
			const promise = discoverGateway();
			clock.runAll();
			fakeMDNSServer.on.should.have.been.calledWith("ready");
		});

		it("after the instance is ready, it should query the local coap domain for all necessary record types", async () => {
			const promise = discoverGateway();
			clock.runAll();

			fakeReadyHandler();

			function assertQuery(domain: string, type: string) {
				const args = fakeMDNSServer.query.getCalls()
					.map(call => Array.isArray(call.args) ? call.args[0] : call.args)
					.reduce((all, cur) => [...all, ...cur], [])
					;
				args.should.deep.include({
					name: domain, type,
				});
			}

			assertQuery(coapDomain, "A");
			assertQuery(coapDomain, "AAAA");
			assertQuery(coapDomain, "PTR");
			assertQuery(coapDomain, "SRV");
			assertQuery(coapDomain, "TXT");
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

		it("should fulfill the promise with a non-null response when ALL answers have been received", async () => {
			let promise;

			const completeResponse = {
				type: "response",
				answers: [],
				additionals: [],
			};

			function assertNotComplete() {
				fakeResponseHandler(completeResponse);
				clock.runAll();
				promise.should.eventually.become(null);
			}

			async function assertComplete() {
				fakeResponseHandler(completeResponse);
				clock.runAll();
				const result = await promise;
				expect(result).to.not.equal(null);
				return result;
			}

			// empty response
			promise = discoverGateway();
			assertNotComplete();

			// We require a certain set of answers:
			// 1. PTR with the short local domain, pointing to the Tradfri gateway
			promise = discoverGateway();
			completeResponse.answers.push({
				name: coapDomain,
				type: "PTR",
				data: completeDomain,
			});
			assertNotComplete();

			// 2. TXT for the complete domain
			promise = discoverGateway();
			completeResponse.answers.push({
				name: completeDomain,
				type: "TXT",
				data: Buffer.from("\u000eversion=1.2.3"),
			});
			assertNotComplete();

			// 3. SRV for the complete domain with the correct port and hostname
			promise = discoverGateway();
			completeResponse.answers.push({
				name: completeDomain,
				type: "SRV",
				data: {
					port: 5684,
					target: hostname,
				},
			});
			assertNotComplete();

			// 4. A-Record for the hostname
			promise = discoverGateway();
			completeResponse.answers.push({
				name: hostname,
				type: "A",
				data: "192.168.1.234",
			});
			const discoverResult = await assertComplete();

			discoverResult.should.deep.equal({
				name: `gw-${gatewayID}`,
				host: hostname,
				version: "1.2.3",
				addresses: ["192.168.1.234"],
			});
		});

		it("should discard responses for the wrong domain", async () => {
			let promise;
			const wrongDomain = coapDomain.replace("udp", "tcp");

			const completeResponse = {
				type: "response",
				answers: [{
					name: wrongDomain,
					type: "PTR",
					data: completeDomain,
				}, {
					name: completeDomain,
					type: "TXT",
					data: Buffer.from("\u000eversion=1.2.3"),
				}, {
					name: completeDomain,
					type: "SRV",
					data: {
						port: 5684,
						target: hostname,
					},
				}, {
					name: hostname,
					type: "A",
					data: "192.168.1.234",
				}],
				additionals: [],
			};

			function assertNotComplete() {
				fakeResponseHandler(completeResponse);
				clock.runAll();
				promise.should.eventually.become(null);
			}

			promise = discoverGateway();
			assertNotComplete();

		});

	});

});
