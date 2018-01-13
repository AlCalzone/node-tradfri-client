import { expect } from "chai";
import { conversions, deserializers, serializers } from "./conversions";
import { colorTemperatureRange } from "./predefined-colors";
// tslint:disable:no-unused-expression

describe("tradfri/conversions => whiteSpectrum <=> colorX =>", () => {

	const serialize = serializers.colorTemperature;
	const deserialize = deserializers.colorTemperature;

	// The white spectrum expressed in colorX values, as defined in the app
	const [min, max] = colorTemperatureRange;

	const inputs = [0, 50, 100];
	const outputs = [min, Math.round((min + max) / 2), max];

	it(`serialize: 0..100% should map to ${min}..${max}`, () => {
		for (let i = 0; i < inputs.length; i++) {
			expect(serialize(inputs[i])).to.equal(outputs[i]);
		}
	});
	it(`deserialize: ${min}..${max} should map to 0..100%`, () => {
		for (let i = 0; i < outputs.length; i++) {
			expect(deserialize(outputs[i])).to.equal(inputs[i]);
		}
	});

});

describe("tradfri/conversions => transitionTime() =>", () => {

	const serialize = serializers.transitionTime;
	const deserialize = deserializers.transitionTime;

	const inputs = [0, .1, .5, 1.0];
	const outputs = [0, 1, 5, 10];

	it("serialize: transmitted values should be 1/10th of seconds", () => {
		for (let i = 0; i < inputs.length; i++) {
			expect(serialize(inputs[i])).to.equal(outputs[i]);
		}
	});
	it("deserialize: transmitted values should be 1/10th of seconds", () => {
		for (let i = 0; i < outputs.length; i++) {
			expect(deserialize(outputs[i])).to.equal(inputs[i]);
		}
	});

});

describe("tradfri/conversions => rgbToHSV() <=> rgbFromHSV", () => {

	it("should correctly convert RGB <=> HSV", () => {
		const testSets = [
			{rgb: {r: 0, g: 0, b: 0}, hsv: {h: 0, s: 0, v: 0}},
			{rgb: {r: 92, g: 46, b: 23}, hsv: {h: 20, s: 0.75, v: 0.36}},
			{rgb: {r: 255, g: 255, b: 255}, hsv: {h: 0, s: 0, v: 1}},
			{rgb: {r: 191, g: 0, b: 255}, hsv: {h: 285, s: 1, v: 1}},
			// TODO: Extend this to the predefined colors
		];
		for (const set of testSets) {
			const {r, g, b} = set.rgb;
			const {h, s, v} = set.hsv;
			expect(conversions.rgbToHSV(r, g, b)).to.deep.equal(set.hsv, "rgbToHSV did not match the expected values");
			expect(conversions.rgbFromHSV(h, s, v)).to.deep.equal(set.rgb, "rgbFromHSV did not match the expected values");
		}
	});

});
