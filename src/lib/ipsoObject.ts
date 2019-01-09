/// <reference types="reflect-metadata" />

import { log } from "./logger";
import { entries } from "./object-polyfill";
import { OperationProvider } from "./operation-provider";

// ===========================================================
// define decorators so we can define all properties type-safe
// tslint:disable:variable-name
const METADATA_ipsoKey = Symbol("ipsoKey");
const METADATA_required = Symbol("required");
const METADATA_serializeWith = Symbol("serializeWith");
const METADATA_deserializeWith = Symbol("deserializeWith");
const METADATA_doNotSerialize = Symbol("doNotSerialize");
// tslint:enable:variable-name

export type PropertyTransformKernel = (value: any, parent?: IPSOObject) => any;
export interface PropertyTransform extends PropertyTransformKernel {
	/** If this transform is not supposed to be skipped ever */
	neverSkip: boolean;
	/** If this transform requires arrays to be split */
	splitArrays: boolean;
}
/**
 * Builds a property transform from a kernel and some options
 * @param kernel The transform kernel
 * @param options Some options regarding the property transform
 */
function buildPropertyTransform(
	kernel: PropertyTransformKernel,
	options: { splitArrays?: boolean, neverSkip?: boolean} = {},
): PropertyTransform {

	if (options.splitArrays == null) options.splitArrays = true;
	if (options.neverSkip == null) options.neverSkip = false;

	const ret = kernel as PropertyTransform;
	ret.splitArrays = options.splitArrays;
	ret.neverSkip = options.neverSkip;
	return ret;
}

export type RequiredPredicate = (me: IPSOObject, reference?: IPSOObject) => boolean;

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
function lookupKeyOrProperty<T extends IPSOObject>(target: T, keyOrProperty: string /*| keyof T*/): string | undefined /*| keyof T*/ {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_ipsoKey, constr);
	return metadata && metadata[keyOrProperty];
}

/**
 * Declares that a property is required to be present in a serialized CoAP object
 */
export const required = (predicate: boolean | RequiredPredicate = true): PropertyDecorator => {
	return <T extends IPSOObject>(target: T, property: keyof T | string) => {
		// get the class constructor
		const constr = target.constructor;
		// retrieve the current metadata
		const metadata = Reflect.getMetadata(METADATA_required, constr) || {};
		// and enhance it (both ways)
		metadata[property] = predicate;
		// store back to the object
		Reflect.defineMetadata(METADATA_required, metadata, constr);
	};
};
/**
 * Checks if a property is required to be present in a serialized CoAP object
 * @param property - property name to lookup
 */
function isRequired<T extends IPSOObject>(target: T, reference: T | undefined, property: keyof T): boolean {
	// get the class constructor
	const constr = target.constructor;
	log(`${constr.name}: checking if ${property} is required...`, "silly");
	// retrieve the current metadata
	const metadata: {[prop: string]: boolean | RequiredPredicate} = Reflect.getMetadata(METADATA_required, constr) || {};
	if (metadata.hasOwnProperty(property)) {
		const ret = metadata[property as keyof typeof metadata];
		if (typeof ret === "boolean") return ret;
		return ret(target, reference);
	}
	return false;
}

/**
 * Checks if a property is required to be present in a serialized CoAP object.
 * In contrast to `isRequired`, this leaves out properties that depend on others.
 * @param property - property name to lookup
 */
function isAlwaysRequired<T extends IPSOObject>(target: T, property: keyof T): boolean {
	// get the class constructor
	const constr = target.constructor;
	log(`${constr.name}: checking if ${property} is always required...`, "silly");
	// retrieve the current metadata
	const metadata: {[prop: string]: boolean | RequiredPredicate} = Reflect.getMetadata(METADATA_required, constr) || {};
	if (metadata.hasOwnProperty(property)) {
		const ret = metadata[property as keyof typeof metadata];
		if (typeof ret === "boolean") return ret;
	}
	return false;
}

/**
 * Defines the required transformations to serialize a property to a CoAP object
 * @param kernel The transformation to apply during serialization
 * @param options Some options regarding the behavior of the property transform
 */
export function serializeWith(kernel: PropertyTransformKernel, options?: { splitArrays?: boolean, neverSkip?: boolean}): PropertyDecorator {
	const transform = buildPropertyTransform(kernel, options);
	return <T extends IPSOObject>(target: T, property: keyof T | string) => {
		// get the class constructor
		const constr = target.constructor;
		// retrieve the current metadata
		const metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};

		metadata[property] = transform;
		// store back to the object
		Reflect.defineMetadata(METADATA_serializeWith, metadata, constr);
	};
}

// default serializers should not be skipped
const defaultSerializers: Record<string, PropertyTransform> = {
	Boolean: buildPropertyTransform((bool: boolean) => bool ? 1 : 0, {neverSkip: true}),
};

/**
 * Retrieves the serializer for a given property
 */
function getSerializer<T extends IPSOObject>(target: T, property: string /* | keyof T*/): PropertyTransform | undefined {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};
	if (metadata.hasOwnProperty(property)) return metadata[property];
	// If there's no custom serializer, try to find a default one
	const type = getPropertyType(target, property);
	if (type && type.name in defaultSerializers) {
		return defaultSerializers[type.name];
	}
}

/**
 * Defines the required transformations to deserialize a property from a CoAP object
 * @param kernel The transformation to apply during deserialization
 * @param options Options for deserialisation
 */
export function deserializeWith(kernel: PropertyTransformKernel, options?: { splitArrays?: boolean, neverSkip?: boolean}): PropertyDecorator {
	const transform = buildPropertyTransform(kernel, options);
	return <T extends IPSOObject>(target: T, property: keyof T | string) => {
		// get the class constructor
		const constr = target.constructor;
		// retrieve the current metadata
		const metadata = Reflect.getMetadata(METADATA_deserializeWith, constr) || {};

		metadata[property] = transform;
		// store back to the object
		Reflect.defineMetadata(METADATA_deserializeWith, metadata, constr);
	};
}

/**
 * Defines that a property will not be serialized
 */
export const doNotSerialize = <T extends IPSOObject>(target: T, property: keyof T | string) => {
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
function isSerializable<T extends IPSOObject>(target: T, property: keyof T): boolean {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_doNotSerialize, constr) || {};
	// if doNotSerialize is defined, don't serialize!
	return ! metadata.hasOwnProperty(property);
}

// default deserializers should not be skipped
const defaultDeserializers: Record<string, PropertyTransform> = {
	Boolean: buildPropertyTransform((raw: any) => raw === 1 || raw === "true" || raw === "on" || raw === true, {neverSkip: true}),
};

/**
 * Retrieves the deserializer for a given property
 */
function getDeserializer<T extends IPSOObject>(target: T, property: string /*| keyof T*/): PropertyTransform | undefined {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_deserializeWith, constr) || {};

	if (metadata.hasOwnProperty(property)) {
		return metadata[property];
	}
	// If there's no custom deserializer, try to find a default one
	const type = getPropertyType(target, property);
	if (type && type.name in defaultDeserializers) {
		return defaultDeserializers[type.name];
	}
}

/**
 * Finds the design type for a given property
 */
// tslint:disable-next-line:ban-types
function getPropertyType<T extends IPSOObject>(target: T, property: string /* | keyof T*/): Function {
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

/**
 * Provides a set of options regarding IPSO objects and serialization
 */
export interface IPSOOptions {
	/**
	 * Determines if basic serializers (i.e. for simple values) should be skipped
	 * This is used to support raw CoAP values instead of the simplified scales
	 */
	skipValueSerializers?: boolean;
}

// common base class for all objects that are transmitted somehow
export class IPSOObject {

	/**
	 * Internal options regarding serialization
	 * @internal
	 */
	@doNotSerialize
	public options: IPSOOptions;

	constructor(options: IPSOOptions = {}) {
		this.options = options;
	}

	// // provide an index signature so TypeScript shuts up when using --noImplicitAny
	// [propName: string]: any;

	/**
	 * Reads this instance's properties from the given object
	 */
	public parse(obj: Record<string, any>): this {
		for (const [key, value] of entries(obj)) {
			let deserializer: PropertyTransform | undefined = getDeserializer(this, key);
			// key might be ipso key or property name
			let propName: string | undefined; // keyof this | string;
			if (deserializer == null) {
				// deserializers are defined by property name, so key is actually the key
				propName = lookupKeyOrProperty(this, key);
				if (!propName) {
					log(`found unknown property with key ${key}`, "warn");
					log(`object was: ${JSON.stringify(obj)}`, "warn");
					continue;
				}
				deserializer = getDeserializer(this, propName);
			} else {
				// the deserializer was found, so key is actually the property name
				propName = key;
			}
			// parse the value
			const requiresArraySplitting: boolean = deserializer ? deserializer.splitArrays : true;
			const parsedValue = this.parseValue(key, value, deserializer, requiresArraySplitting);
			// and remember it - we are now sure propname is a keyof this
			this[propName as keyof this] = parsedValue;
		}
		return this;
	}

	// parses a value, depending on the value type and defined parsers
	private parseValue(propKey: string /*| symbol*/, value: any, transform?: PropertyTransform, requiresArraySplitting: boolean = true): any {
		if (value instanceof Array && requiresArraySplitting) {
			// Array: parse every element
			return value.map(v => this.parseValue(propKey, v, transform, requiresArraySplitting));
		} else if (typeof value === "object") {
			// Object: try to parse this, objects should be parsed in any case
			if (transform) {
				return transform(value, this);
			} else {
				log(`could not find deserializer for key ${propKey}`, "warn");
			}
		} else if (transform && (transform.neverSkip || !this.options.skipValueSerializers)) {
			return transform(value, this);
		} else {
			// otherwise just return the value
			return value;
		}
	}

	/**
	 * Overrides this object's properties with those from another partial one
	 */
	public merge(obj: Partial<this>, allProperties: boolean = false): this {
		for (const [key, value] of entries(obj as Record<string, any>)) {
			if (allProperties || this.hasOwnProperty(key)) {
				// we can't be sure that this has a property `key`
				(this as any)[key] = value;
			}
		}
		return this;
	}

	/** serializes this object in order to transfer it via COAP */
	public serialize(reference?: this): Record<string, any> {
		// unproxy objects before serialization
		if (this.isProxy) return this.unproxy().serialize(reference);
		if (
			reference != null &&
			reference instanceof IPSOObject &&
			reference.isProxy
		) reference = reference.unproxy();

		const ret: Record<string, any> = {};

		const serializeValue = (propName: keyof this, value: any, refValue: any, transform?: PropertyTransform) => {
			const _required = isRequired(this, reference, propName);
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
			if (transform && (transform.neverSkip || !this.options.skipValueSerializers)) {
				_ret = transform(_ret, this);
			} else if (typeof _ret === "number" && this.options.skipValueSerializers) {
				_ret = Math.round(_ret);
			}
			return _ret;
		};

		// check all set properties
		for (const propName of Object.keys(this) as (Extract<keyof this, string>)[]) {
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
				let value: any = this[propName];
				let refValue: any = null;
				if (reference != null && reference.hasOwnProperty(propName)) {
					refValue = reference[propName];
				}

				// try to find serializer for this property
				const serializer = getSerializer(this, propName);
				const requiresArraySplitting = serializer ? serializer.splitArrays : true;

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
					value = (value as any[]).filter(v => v != null);
					if (value.length === 0) value = null;
				} else {
					// directly serialize the value
					value = serializeValue(propName, value, refValue, serializer);
				}

				// only output the value if it's != null
				// We cannot use !!value here because that would strip out "" and 0
				if (!!key && value != null) ret[key] = value;
			}
		}

		return ret;
	}

	/**
	 * Deeply clones an IPSO Object
	 */
	public clone(...constructorArgs: any[]): this {
		// create a new instance of the same object as this
		interface Constructable<T> {
			new(options?: IPSOOptions, ...constructorArgs: any[]): T;
		}
		const constructor = this.constructor as Constructable<this>;
		const ret = new constructor(this.options, ...constructorArgs);
		// serialize the old values
		const serialized = this.serialize();
		// and parse them back
		return ret.parse(serialized);
	}

	private isSerializedObjectEmpty(obj: Record<string, any>): boolean {
		// Prüfen, ob eine nicht-benötigte Eigenschaft angegeben ist. => nicht leer
		for (const key of Object.keys(obj)) {
			const propName = lookupKeyOrProperty(this, key) as keyof this;
			if (!isAlwaysRequired(this, propName)) {
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
		set?: (me: this, key: PropertyKey, value: any, receiver: any) => boolean,
	): this {
		// per default create a proxy that proxies all IPSOObject instances (single or array)
		return new Proxy(this, {
			get: (me: any, key: PropertyKey) => {
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
			set: (me: any, key: PropertyKey, value, receiver) => {
				// if defined, call the overloaded setter
				if (set != null) return set(me, key, value, receiver);
				// else continue with predefined behaviour

				// simply set all properties
				me[key] = value;
				return true;
			},
		});
	}

	@doNotSerialize protected client: OperationProvider | undefined;
	/**
	 * Link this object to a TradfriClient for a simplified API.
	 * @internal
	 * @param client The client instance to link this object to
	 */
	public link(client: OperationProvider): this {
		this.client = client;
		return this;
	}

	/**
	 * Fixes property values that are known to be bugged
	 */
	public fixBuggedProperties(): this {
		// IPSOObject has none
		return this;
	}

}
