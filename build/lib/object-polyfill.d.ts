export interface DictionaryLike<T> {
    [key: string]: T;
}
export declare type Predicate<T> = (value: T) => boolean;
export declare type KeyValuePair<T> = [string, T];
/**
 * Stellt einen Polyfill für Object.entries bereit
 * @param obj Das Objekt, dessen Eigenschaften als Key-Value-Pair iteriert werden sollen
 */
export declare function entries<T>(obj: DictionaryLike<T>): KeyValuePair<T>[];
/**
 * Stellt einen Polyfill für Object.values bereit
 * @param obj Das Objekt, dessen Eigenschaftswerte iteriert werden sollen
 */
export declare function values<T>(obj: DictionaryLike<T>): T[];
/**
 * Gibt ein Subset eines Objekts zurück, dessen Eigenschaften einem Filter entsprechen
 * @param obj Das Objekt, dessen Eigenschaften gefiltert werden sollen
 * @param predicate Die Filter-Funktion, die auf Eigenschaften angewendet wird
 */
export declare function filter<T>(obj: DictionaryLike<T>, predicate: Predicate<T>): DictionaryLike<T>;
/**
 * Kombinierte mehrere Key-Value-Paare zu einem Objekt
 * @param properties Die Key-Value-Paare, die zu einem Objekt kombiniert werden sollen
 */
export declare function composeObject<T>(properties: KeyValuePair<T>[]): DictionaryLike<T>;
export declare function dig<T>(object: DictionaryLike<T>, path: string): any;
export declare function bury<T>(object: DictionaryLike<T>, path: string, value: any): any;
export declare function extend(target: any, source: any): any;
