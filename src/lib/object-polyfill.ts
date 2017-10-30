export interface DictionaryLike<T> {
	[key: string]: T;
}
export type Predicate<T> = (value: T) => boolean;
export type KeyValuePair<T> = [string, T];

/**
 * Stellt einen Polyfill für Object.entries bereit
 * @param obj Das Objekt, dessen Eigenschaften als Key-Value-Pair iteriert werden sollen
 */
export function entries<T>(obj: DictionaryLike<T>): KeyValuePair<T>[];
export function entries(obj: any): KeyValuePair<any>[] {
	return Object.keys(obj)
		.map(key => [key, obj[key]] as KeyValuePair<any>)
		;

	}

/**
 * Stellt einen Polyfill für Object.values bereit
 * @param obj Das Objekt, dessen Eigenschaftswerte iteriert werden sollen
 */
export function values<T>(obj: DictionaryLike<T>): T[];
export function values(obj): any[] {
	return Object.keys(obj)
		.map(key => obj[key])
		;
}

/**
 * Gibt ein Subset eines Objekts zurück, dessen Eigenschaften einem Filter entsprechen
 * @param obj Das Objekt, dessen Eigenschaften gefiltert werden sollen
 * @param predicate Die Filter-Funktion, die auf Eigenschaften angewendet wird
 */
export function filter<T>(obj: DictionaryLike<T>, predicate: Predicate<T>): DictionaryLike<T>;
export function filter(obj: any, predicate: Predicate<any>) {
	const ret = {};
	for (const [key, val] of entries(obj)) {
		if (predicate(val)) ret[key] = val;
	}
	return ret;
}

/**
 * Kombinierte mehrere Key-Value-Paare zu einem Objekt
 * @param properties Die Key-Value-Paare, die zu einem Objekt kombiniert werden sollen
 */
export function composeObject<T>(properties: KeyValuePair<T>[]): DictionaryLike<T>;
export function composeObject(properties: KeyValuePair<any>[]): DictionaryLike<any> {
	return properties.reduce((acc, [key, value]) => {
		acc[key] = value;
		return acc;
	}, {});
}

// Gräbt in einem Objekt nach dem Property-Pfad.
// Bsps: (obj, "common.asdf.qwer") => obj.common.asdf.qwer
export function dig<T>(object: DictionaryLike<T>, path: string);
export function dig(object: DictionaryLike<any>, path: string) {
	function _dig(obj: DictionaryLike<any>, pathArr: string[]) {
		// are we there yet? then return obj
		if (!pathArr.length) return obj;
		// go deeper
		let propName: string | number = pathArr.shift();
		if (/\[\d+\]/.test(propName)) {
			// this is an array index
			propName = +propName.slice(1, -1);
		}
		return _dig(obj[propName], pathArr);
	}
	return _dig(object, path.split("."));
}

// Vergräbt eine Eigenschaft in einem Objekt (Gegenteil von dig)
export function bury<T>(object: DictionaryLike<T>, path: string, value: any);
export function bury(object: DictionaryLike<any>, path: string, value: any) {
	function _bury(obj: DictionaryLike<any>, pathArr: string[]) {
		// are we there yet? then return obj
		if (pathArr.length === 1) {
			obj[pathArr[0]] = value;
			return;
		}
		// go deeper
		let propName: string | number = pathArr.shift();
		if (/\[\d+\]/.test(propName)) {
			// this is an array index
			propName = +propName.slice(1, -1);
		}
		_bury(obj[propName], pathArr);
	}
	_bury(object, path.split("."));
}

// Kopiert Eigenschaften rekursiv von einem Objekt auf ein anderes
export function extend(target, source) {
	target = target || {};
	for (const [prop, val] of entries(source)) {
		if (val instanceof Object) {
			target[prop] = extend(target[prop], val);
		} else {
			target[prop] = val;
		}
	}
	return target;
}
