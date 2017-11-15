import { expect } from "chai";
import { except, firstOrDefault } from "./array-extensions";
// tslint:disable:no-unused-expression

describe("lib/array-extensions => except() =>", () => {

	it("should work for b[] ⊆ a[]", () => {
		const a = [1, 3, 5, 7, 8];
		const b = [1, 5, 8];
		const expected = [3, 7];
		expect(except(a, b)).to.deep.equal(expected);
	});

	it("should work for b[] ⊊ a[]", () => {
		const a = [1, 3, 5, 7, 8];
		const b = [1, 5, 8, 9, 11];
		const expected = [3, 7];
		expect(except(a, b)).to.deep.equal(expected);
	});

	it("should work for b[] ⊇ a[]", () => {
		const b = [1, 3, 5, 7, 8];
		const a = [1, 5, 8];
		const expected = [];
		expect(except(a, b)).to.deep.equal(expected);
	});

	it("should work for empty arrays", () => {
		const a = [1, 5, 8];
		const b = [];
		const c = [4, 5, 6];
		expect(except(a, b)).to.deep.equal(a);
		expect(except(b, c)).to.deep.equal(b);
		expect(except(c, b)).to.deep.equal(c);
		expect(except(b, b)).to.deep.equal(b);
	});

	it("should work for unordered arrays", () => {
		const a = [11, 5, 8];
		const b = [7, 8, 5];
		const expected = [11];
		expect(except(a, b)).to.deep.equal(expected);
	});

});

// describe("lib/array-extensions => intersect() =>", () => {

// 	it("should work for b[] ⊆ a[]", () => {
// 		const a = [1, 3, 5, 7, 8];
// 		const b = [1, 5, 8];
// 		const expected = b;
// 		expect(intersect(a, b)).to.deep.equal(expected);
// 	});

// 	it("should work for b[] ⊊ a[]", () => {
// 		const a = [1, 3, 5, 7, 8];
// 		const b = [1, 5, 8, 9, 11];
// 		const expected = [1, 5, 8];
// 		expect(intersect(a, b)).to.deep.equal(expected);
// 	});

// 	it("shouldn't depend on the argument order", () => {
// 		const a = [1, 3, 5, 7, 8];
// 		const b = [1, 5, 8, 9, 11];
// 		const expected = [1, 5, 8];
// 		expect(intersect(a, b)).to.deep.equal(expected);
// 		expect(intersect(a, b)).to.deep.equal(intersect(b, a));
// 	});

// 	it("should work for empty arrays", () => {
// 		const a = [1, 5, 8];
// 		const b = [];
// 		const c = [4, 5, 6];
// 		expect(intersect(a, b)).to.deep.equal([]);
// 		expect(intersect(b, c)).to.deep.equal([]);
// 		expect(intersect(c, b)).to.deep.equal([]);
// 		expect(intersect(b, b)).to.deep.equal([]);
// 	});

// });

// describe("lib/array-extensions => range() =>", () => {

// 	it("should work", () => {
// 		expect(range(1, 7)).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);
// 	});
// 	it("should work for negative values", () => {
// 		expect(range(-2, 2)).to.deep.equal([-2, -1, 0, 1, 2]);
// 	});

// 	it("should work for reversed min/max", () => {
// 		expect(range(4, 1)).to.deep.equal([1, 2, 3, 4]);
// 	});

// 	it("should work for min = max", () => {
// 		expect(range(1, 1)).to.deep.equal([1]);
// 	});

// });

describe("lib/array-extensions => firstOrDefault() =>", () => {

	const source = [1, 2, 3, 4, 5];

	it("should return the first value found", () => {
		expect(firstOrDefault(source, (i => i > 3))).to.equal(4);
	});
	it("should return null if no match is found", () => {
		expect(firstOrDefault(source, (i => i > 6))).to.be.null;
	});

});
