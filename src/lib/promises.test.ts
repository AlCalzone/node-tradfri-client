import { assert, expect } from "chai";
import { promisify, promisifyNoError, wait } from "./promises";
// tslint:disable:no-unused-expression

function callbackApiWithError(returnError: boolean, callback: (err: any, result?: boolean) => void) {
	if (returnError) {
		callback(new Error("you wanted an error!"));
	} else {
		callback(null, true);
	}
}

function callbackApiWithoutError(callback: (result: boolean) => void) {
	callback(true);
}

describe("lib/promises => promisify()", () => {
	const promisifiedApi = promisify<boolean>(callbackApiWithError);

	it("should throw", async () => {
		try {
			await promisifiedApi(true);
			assert(false, "it didn't throw");
		} catch (e) {
			assert(true);
		}
	});

	it("shouldn't throw", async () => {
		try {
			await promisifiedApi(false);
			assert(true);
		} catch (e) {
			assert(false, "it did throw");
		}
	});

});

describe("lib/promises => promisifyNoError()", () => {
	const promisifiedApi = promisifyNoError<boolean>(callbackApiWithoutError);

	it("shouldn't throw", async () => {
		try {
			await promisifiedApi();
			assert(true);
		} catch (e) {
			assert(false, "it did throw");
		}
	});
});

describe("lib/promises => wait()", () => {
	let start;
	const timeout = 100;
	const delta = 20;

	it(`wait(${timeout}) should wait (${timeout}±${delta}) ms`, async function() {
		// this is not super accurate, so retry a few times until it works
		this.retries(10);

		start = Date.now();
		await wait(timeout);
		expect(Date.now() - start).to.be.approximately(timeout, delta);
	});
});
