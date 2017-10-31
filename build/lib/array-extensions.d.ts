/**
 * Gibt die Schnittmenge zweier numerischer Arrays aus,
 * es wird angenommen, dass sie schon sortiert sind
 * @param a
 * @param b
 */
export declare function intersect(a: number[], b: number[]): number[];
export declare function except<T>(a: T[], b: T[]): T[];
export declare function range(min: number, max: number): number[];
export declare function firstOrDefault<T>(arr: T[], filter: (item: T) => boolean): T;
