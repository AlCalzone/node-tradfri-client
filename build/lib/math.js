"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** limits a value to the range given by min/max */
function clamp(value, min, max) {
    if (min > max) {
        [min, max] = [max, min];
    }
    if (value < min)
        return min;
    if (value > max)
        return max;
    return value;
}
exports.clamp = clamp;
function roundTo(value, digits) {
    const exp = Math.pow(10, digits);
    return Math.round(value * exp) / exp;
}
exports.roundTo = roundTo;
/**
 * Tests if a point is inside a given triangle
 */
function pointInTriangle(triangle, point) {
    // based on http://totologic.blogspot.de/2014/01/accurate-point-in-triangle-test.html
    const [{ x: x1, y: y1 }, { x: x2, y: y2 }, { x: x3, y: y3 },] = triangle;
    const { x, y } = point;
    const denominator = ((y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3));
    const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denominator;
    const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denominator;
    const c = 1 - a - b;
    return 0 <= a && a <= 1 && 0 <= b && b <= 1 && 0 <= c && c <= 1;
}
exports.pointInTriangle = pointInTriangle;
function distanceSquared(a, b) {
    return Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2);
}
exports.distanceSquared = distanceSquared;
function findClosestTriangleEdge(point, triangle) {
    const distances = triangle.map(p => distanceSquared(p, point));
    const maxDistance = Math.max(...distances);
    for (let i = 0; i < distances.length; i++) {
        if (distances[i] === maxDistance) {
            triangle.splice(i, 1);
            return triangle;
        }
    }
    return [triangle[0], triangle[1]];
}
exports.findClosestTriangleEdge = findClosestTriangleEdge;
function dotProduct(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
}
exports.dotProduct = dotProduct;
function subtractVector(a, b) {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
    };
}
exports.subtractVector = subtractVector;
function addVector(v1, v2) {
    return {
        x: v1.x + v2.x,
        y: v1.y + v2.y,
    };
}
exports.addVector = addVector;
function scaleVector(v, factor) {
    return {
        x: factor * v.x,
        y: factor * v.y,
    };
}
exports.scaleVector = scaleVector;
function projectPointOnEdge(point, edge) {
    const [a, b] = edge;
    const c = point;
    const ac = subtractVector(c, a);
    const ab = subtractVector(b, a);
    let s = dotProduct(ac, ab) / dotProduct(ab, ab);
    s = clamp(s, 0, 1);
    return addVector(a, scaleVector(ab, s));
}
exports.projectPointOnEdge = projectPointOnEdge;
