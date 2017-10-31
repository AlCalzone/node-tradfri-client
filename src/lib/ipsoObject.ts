import { log } from "./logger";
import { DictionaryLike, entries } from "./object-polyfill";

// ===========================================================
// define decorators so we can define all properties type-safe
// tslint:disable:variable-name
const METADATA_ipsoKey = Symbol("ipsoKey");
const METADATA_required = Symbol("required");
const METADATA_serializeWith = Symbol("serializeWith");
const METADATA_deserializeWith = Symbol("deserializeWith");
const METADATA_doNotSerialize = Symbol("doNotSerialize");
// tslint:enable:variable-name

export type PropertyTransform = (value: any, parent?: IPSOObject) => any;

/**
 * Defines the ipso key neccessary to serialize a property to a CoAP object
 */
export const ipsoKey = (key: string): PropertyDecorator => {
	return (target: object, property: string | symbol) => {
		// get the class constructor
		const constr = target.constructor;
		// retrieve the current metadata
		const metadata = Reflect.getMetadata(METADATA_ipsoKey, constr) || {};
		// and enhance it (both ways)
		metadata[property] = key;
		metadata[key] = property;
		// store back to the object
		Reflect.defineMetadata(METADATA_ipsoKey, metadata, constr);
	};
};
/**
 * Looks up previously stored property ipso key definitions.
 * Returns a property name if the key was given, or the key if a property name was given.
 * @param keyOrProperty - ipso key or property name to lookup
 */
function lookupKeyOrProperty(target: object, keyOrProperty: string | symbol): string | symbol {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_ipsoKey, constr) || {};
	if (metadata.hasOwnProperty(keyOrProperty)) return metadata[keyOrProperty];
	return null;
}

/**
 * Declares that a property is required to be present in a serialized CoAP object
 */
export function required(target: object, property: string | symbol): void {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_required, constr) || {};
	// and enhance it (both ways)
	metadata[property] = true;
	// store back to the object
	Reflect.defineMetadata(METADATA_required, metadata, constr);
}
/**
 * Checks if a property is required to be present in a serialized CoAP object
 * @param property - property name to lookup
 */
function isRequired(target: object, property: string | symbol): boolean {
	// get the class constructor
	const constr = target.constructor;
	log(`${constr.name}: checking if ${property} is required...`, "silly");
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_required, constr) || {};
	if (metadata.hasOwnProperty(property)) return metadata[property];
	return false;
}

/**
 * Defines the required transformations to serialize a property to a CoAP object
 * @param transform: The transformation to apply during serialization
 * @param splitArrays: Whether the serializer expects arrays to be split up in advance
 */
export const serializeWith = (transform: PropertyTransform, splitArrays: boolean = true): PropertyDecorator => {
	return (target: object, property: string | symbol) => {
		// get the class constructor
		const constr = target.constructor;
		// retrieve the current metadata
		const metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};

		metadata[property] = {transform, splitArrays};
		// store back to the object
		Reflect.defineMetadata(METADATA_serializeWith, metadata, constr);
	};
};

// tslint:disable:object-literal-key-quotes
export const defaultSerializers: DictionaryLike<PropertyTransform> = {
	"Boolean": (bool: boolean) => bool ? 1 : 0,
};
// tslint:enable:object-literal-key-quotes

/**
 * Retrieves the serializer for a given property
 */
function getSerializer(target: object, property: string | symbol): PropertyTransform {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};
	if (metadata.hasOwnProperty(property)) return metadata[property].transform;
	// If there's no custom serializer, try to find a default one
	const type = getPropertyType(target, property);
	if (type && type.name in defaultSerializers) {
		return defaultSerializers[type.name];
	}
}

/**
 * Checks if the deserializer for a given property expects arrays to be split in advance
 */
function serializerRequiresArraySplitting(target: object, property: string | symbol): boolean {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};

	if (metadata.hasOwnProperty(property)) {
		return metadata[property].splitArrays;
	}
	// return default value => true
	return true;
}

/**
 * Defines the required transformations to deserialize a property from a CoAP object
 * @param transform: The transformation to apply during deserialization
 * @param splitArrays: Whether the deserializer expects arrays to be split up in advance
 */
export const deserializeWith = (transforms: PropertyTransform | PropertyTransform[], splitArrays: boolean = true): PropertyDecorator => {
	// make sure we have an array of transforms
	if (!(transforms instanceof Array)) transforms = [transforms];
	return (target: object, property: string | symbol) => {
		// get the class constructor
		const constr = target.constructor;
		// retrieve the current metadata
		const metadata = Reflect.getMetadata(METADATA_deserializeWith, constr) || {};

		metadata[property] = {transforms, splitArrays};
		// store back to the object
		Reflect.defineMetadata(METADATA_deserializeWith, metadata, constr);
	};
};

/**
 * Defines that a property will not be serialized
 */
export const doNotSerialize = (target: object, property: string | symbol) => {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_doNotSerialize, constr) || {};
	metadata[property] = true;
	// store back to the object
	Reflect.defineMetadata(METADATA_doNotSerialize, metadata, constr);
};

/**
 * Checks if a given property will be serialized or not
 */
function isSerializable(target: object, property: string | symbol): boolean {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_doNotSerialize, constr) || {};
	// if doNotSerialize is defined, don't serialize!
	return ! metadata.hasOwnProperty(property);
}

// tslint:disable:object-literal-key-quotes
export const defaultDeserializers: DictionaryLike<PropertyTransform> = {
	"Boolean": (raw: any) => raw === 1 || raw === "true" || raw === "on" || raw === true,
};
// tslint:enable:object-literal-key-quotes

/**
 * Retrieves the deserializer for a given property
 */
function getDeserializers(target: object, property: string | symbol): PropertyTransform[] {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_deserializeWith, constr) || {};

	if (metadata.hasOwnProperty(property)) {
		return metadata[property].transforms;
	}
	// If there's no custom deserializer, try to find a default one
	const type = getPropertyType(target, property);
	if (type && type.name in defaultDeserializers) {
		return [defaultDeserializers[type.name]];
	}
}

/**
 * Apply a series of deserializers in the defined order. The first one returning a value != null wins
 */
function applyDeserializers(deserializers: PropertyTransform[], target: any, parent?: IPSOObject): any {
	for (const d of deserializers) {
		const ret = d(target, parent);
		if (ret != null) return ret;
	}
	return null;
}

/**
 * Checks if the deserializer for a given property expects arrays to be split in advance
 */
function deserializerRequiresArraySplitting(target: object, property: string | symbol): boolean {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_deserializeWith, constr) || {};

	if (metadata.hasOwnProperty(property)) {
		return metadata[property].splitArrays;
	}
	// return default value => true
	return true;
}

/**
 * Finds the design type for a given property
 */
// tslint:disable-next-line:ban-types
function getPropertyType(target: object, property: string | symbol): Function {
	return Reflect.getMetadata("design:type", target, property);
}

// ==========================================
// Start of ipsoObject implementation
// ==========================================

/**
 * Allows checking if an IPSOObject was proxied and provides access
 * to the unproxied object. Usage:
 * (obj as IPSOObjectProxy<T>).isProxy;
 * (obj as IPSOObjectProxy<T>).underlyingObject;
 */
interface ProxiedIPSOObject<T extends IPSOObject> extends IPSOObject {
	readonly underlyingObject: T;
}

// common base class for all objects that are transmitted somehow
export class IPSOObject {

	/**
	 * Reads this instance's properties from the given object
	 */
	public parse(obj: DictionaryLike<any>): this {
		for (const [key, value] of entries(obj)) {
			let deserializers: PropertyTransform[] = getDeserializers(this, key);
			let requiresArraySplitting: boolean = deserializerRequiresArraySplitting(this, key);
			// key might be ipso key or property name
			let propName: string | symbol;
			if (deserializers == null) {
				// deserializers are defined by property name, so key is actually the key
				propName = lookupKeyOrProperty(this, key);
				if (!propName) {
					log(`found unknown property with key ${key}`, "warn");
					log(`object was: ${JSON.stringify(obj)}`, "warn");
					continue;
				}
				deserializers = getDeserializers(this, propName);
				requiresArraySplitting = deserializerRequiresArraySplitting(this, propName);
			} else {
				// the deserializer was found, so key is actually the property name
				propName = key;
			}
			// parse the value
			const parsedValue = this.parseValue(key, value, deserializers, requiresArraySplitting);
			// and remember it
			this[propName] = parsedValue;
		}
		return this;
	}

	// parses a value, depending on the value type and defined parsers
	private parseValue(propKey, value, deserializers?: PropertyTransform[], requiresArraySplitting: boolean = true): any {
		if (value instanceof Array && requiresArraySplitting) {
			// Array: parse every element
			return value.map(v => this.parseValue(propKey, v, deserializers, requiresArraySplitting));
		} else if (typeof value === "object") {
			// Object: try to parse this, objects should be parsed in any case
			if (deserializers) {
				return applyDeserializers(deserializers, value, this);
			} else {
				log(`could not find deserializer for key ${propKey}`, "warn");
			}
		} else if (deserializers) {
			// if this property needs a parser, parse the value
			return applyDeserializers(deserializers, value, this);
		} else {
			// otherwise just return the value
			return value;
		}
	}

	/**
	 * Overrides this object's properties with those from another partial one
	 */
	public merge(obj: Partial<this>): this {
		for (const [key, value] of entries(obj as DictionaryLike<any>)) {
			if (this.hasOwnProperty(key)) {
				this[key] = value;
			}
		}
		return this;
	}

	/** serializes this object in order to transfer it via COAP */
	public serialize(reference = null): DictionaryLike<any> {
		// unproxy objects before serialization
		if (this.isProxy) return this.unproxy().serialize(reference);
		if (
			reference != null &&
			reference instanceof IPSOObject &&
			reference.isProxy
		) reference = reference.unproxy();

		const ret = {};

		const serializeValue = (propName, value, refValue, transform?: PropertyTransform) => {
			const _required = isRequired(this, propName);
			let _ret = value;
			if (value instanceof IPSOObject) {
				// if the value is another IPSOObject, then serialize that
				_ret = value.serialize(refValue);
				// if the serialized object contains no required properties, don't remember it
				if (value.isSerializedObjectEmpty(_ret)) return null;
			} else {
				// if the value is not the default one, then remember it
				if (refValue != null) {
					if (!_required && refValue === value) return null;
				} else {
					// there is no default value, just remember the actual value
				}
			}
			if (transform) _ret = transform(_ret, this);
			return _ret;
		};

		// check all set properties
		for (const propName of Object.keys(this)) {
			// check if this property is going to be serialized
			if (
				// properties starting with "_" are private by convention
				!propName.startsWith("_") &&
				// non-existent properties aren't going to be serialized
				this.hasOwnProperty(propName) &&
				// the same goes for properties with @doNotSerialize
				isSerializable(this, propName)
			) {
				// find IPSO key
				const key = lookupKeyOrProperty(this, propName);
				// find value and reference (default) value
				let value = this[propName];
				let refValue = null;
				if (reference != null && reference.hasOwnProperty(propName)) {
					refValue = reference[propName];
				}

				// try to find serializer for this property
				const serializer = getSerializer(this, propName);
				const requiresArraySplitting: boolean = serializerRequiresArraySplitting(this, propName);

				if (value instanceof Array && requiresArraySplitting) {
					// serialize each item
					if (refValue != null) {
						// reference value exists, make sure we have the same amount of items
						if (!(refValue instanceof Array && refValue.length === value.length)) {
							throw new Error("cannot serialize arrays when the reference values don't match");
						}
						// serialize each item with the matching reference value
						value = value.map((v, i) => serializeValue(propName, v, refValue[i], serializer));
					} else {
						// no reference value, makes things easier
						value = value.map(v => serializeValue(propName, v, null, serializer));
					}
					// now remove null items
					value = value.filter(v => v != null);
					if (value.length === 0) value = null;
				} else {
					// directly serialize the value
					value = serializeValue(propName, value, refValue, serializer);
				}

				// only output the value if it's != null
				if (value != null) ret[key] = value;
			}
		}

		return ret;
	}

	/**
	 * Deeply clones an IPSO Object
	 */
	public clone(): this {
		// create a new instance of the same object as this
		interface Constructable<T> {
			new(): T;
		}
		const constructor = this.constructor as Constructable<this>;
		const ret = new constructor();
		// serialize the old values
		const serialized = this.serialize();
		// and parse them back
		return (ret as IPSOObject).parse(serialized) as this;
	}

	private isSerializedObjectEmpty(obj: DictionaryLike<any>): boolean {
		// Prüfen, ob eine nicht-benötigte Eigenschaft angegeben ist. => nicht leer
		for (const key of Object.keys(obj)) {
			const propName = lookupKeyOrProperty(this, key);
			if (!isRequired(this, propName)) {
				return false;
			}
		}
		return true;
	}

	/** If this object was proxied or not */
	@doNotSerialize public readonly isProxy: boolean = false;
	// is overridden inside the proxy

	/** Returns the raw object without a wrapping proxy */
	public unproxy(): this {
		if (this.isProxy) {
			return (this as any as ProxiedIPSOObject<this>).underlyingObject;
		}
		return this;
	}

	/**
	 * Creates a proxy for this device
	 * @param get Custom getter trap (optional). This is called after mandatory traps are in place and before default behavior
	 * @param set Custom setter trap (optional). This is called after mandatory traps are in place and before default behavior
	 */
	public createProxy(
		get?: (me: this, key: PropertyKey) => any,
		set?: (me: this, key: PropertyKey, value, receiver) => boolean,
	): this {
		// per default create a proxy that proxies all IPSOObject instances (single or array)
		return new Proxy(this, {
			get: (me: this, key: PropertyKey) => {
				// add some metadata
				if (key === "isProxy") return true;
				if (key === "underlyingObject") return me;
				if (key === "unproxy") return me.unproxy;

				// if defined, call the overloaded getter
				if (get != null) return get(me, key);
				// else continue with predefined behaviour

				// simply return functions
				if (typeof me[key] === "function") {
					if (key === "clone") {
						// clones of proxies should also be proxies
						return () => me.clone().createProxy();
					} else {
						return me[key];
					}
				}
				// proxy all IPSOObject-Arrays
				if (
					me[key] instanceof Array &&
					me[key].length > 0 &&
					me[key][0] instanceof IPSOObject
				) {
					return me[key].map((d: IPSOObject) => d.createProxy());
				}
				// proxy all IPSO-Object instances
				if (me[key] instanceof IPSOObject) return me[key].createProxy();
				// return all other properties
				return me[key];
			},
			set: (me: this, key: PropertyKey, value, receiver) => {
				// if defined, call the overloaded setter
				if (set != null) return set(me, key, value, receiver);
				// else continue with predefined behaviour

				// simply set all properties
				me[key] = value;
				return true;
			},
		});
	}

}
