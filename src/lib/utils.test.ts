// tslint:disable:no-unused-expression
import { invertOperation } from "./utils";
import { assert, expect } from "chai";

describe("lib/utils => invertOperation() =>", () => {
	it("leaves empty operations untouched", () => {
		expect(invertOperation({})).to.deep.equal({});
	});

	it("sets numeric properties to NaN", () => {
		expect(
			invertOperation({
				foo: 5
			})
		).to.deep.equal({
			foo: NaN
		});
	});

	it("sets boolean properties to the opposite value", () => {
		expect(
			invertOperation({
				bar: true
			})
		).to.deep.equal({
			bar: false
		});
		expect(
			invertOperation({
				baz: false
			})
		).to.deep.equal({
			baz: true
		});
	});

	it("sets all other properties to null", () => {
		expect(
			invertOperation({
				foo: "string"
			})
		).to.deep.equal({
			foo: null
		});
		expect(
			invertOperation({
				foo: {}
			})
		).to.deep.equal({
			foo: null
		});
		expect(
			invertOperation({
				foo: () => {}
			})
		).to.deep.equal({
			foo: null
		});
	});

	it("works for multiple properties", () => {
		expect(
			invertOperation({
				foo: "string",
				bar: true,
				baz: 8
			})
		).to.deep.equal({
			foo: null,
			bar: false,
			baz: NaN
		});
	});
});
