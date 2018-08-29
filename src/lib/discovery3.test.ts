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

import * as proxyquireModule from "proxyquire";
const proxyquire = proxyquireModule.noPreserveCache();
const {
	discoverGateway,
	// tslint:disable-next-line:whitespace
} = proxyquire<typeof import("./discovery3")>("./discovery3", {
	"multicast-dns": fakeMDNSPackage,
});

describe("lib/discovery3 => ", () => {

	let clock: SinonFakeTimers;
	beforeEach(() => {
		clock = useFakeTimers();
	});

	afterEach(() => {
		fakeMDNSPackage.resetHistory();
		fakeMDNSServer.query.resetHistory();
		fakeMDNSServer.destroy.resetHistory();

		clock.restore();
	});

	describe("discoverGateway() => ", () => {

		const coapDomain = "_coap._udp.local";
		const gatewayID = "123456abcdef";
		const completeDomain = `gw-${gatewayID}.${coapDomain}`;
		const hostname = `TRADFRI-Gateway-${gatewayID}.local`;

		it.skip("should create a new mdns server instance each call", async () => {
			let promise = discoverGateway();
			clock.runAll();
			await promise;

			fakeMDNSPackage.should.have.been.calledOnce;
			promise = discoverGateway();
			clock.runAll();
			await promise;
			fakeMDNSPackage.should.have.been.calledTwice;
		});

		it.skip("should register a response handler", async () => {
			const promise = discoverGateway();
			clock.runAll();
			await promise;
			fakeMDNSServer.on.should.have.been.calledWith("response");
		});

		it.skip("should query the local coap domain for all necessary record types", async () => {
			const promise = discoverGateway();
			fakeReadyHandler();
			clock.runAll();
			await promise;

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

		it.skip("without a service response, discoverGateway() should fulfill with null after the default timeout has elapsed", (done) => {
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

		it.skip("without a service response, discoverGateway(timeout) should fulfill with null after the passed timeout has elapsed", (done) => {
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

		it.skip("without a service response, discoverGateway should never fulfill with the timeout disabled", (done) => {
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

		it.skip("should fulfill the promise with a non-null response when ALL answers have been received", async () => {
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

		it.skip("should discard responses for the wrong domain", async () => {
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
