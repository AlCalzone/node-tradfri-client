/** limits a value to the range given by min/max */
export declare function clamp(value: number, min: number, max: number): number;
export declare function roundTo(value: number, digits: number): number;
export interface Point {
    x: number;
    y: number;
}
export declare type Vector = Point;
/**
 * Tests if a point is inside a given triangle
 */
export declare function pointInTriangle(triangle: [Point, Point, Point], point: Point): boolean;
export declare function distanceSquared(a: Point, b: Point): number;
export declare function findClosestTriangleEdge(point: Point, triangle: [Point, Point, Point]): [Point, Point];
export declare function dotProduct(v1: Vector, v2: Vector): number;
export declare function subtractVector(a: Vector, b: Vector): Vector;
export declare function addVector(v1: Vector, v2: Vector): Vector;
export declare function scaleVector(v: Vector, factor: number): Vector;
export declare function projectPointOnEdge(point: Point, edge: [Point, Point]): Point;
