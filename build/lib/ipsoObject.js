"use strict";
/// <reference types="reflect-metadata" />
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPSOObject = exports.doNotSerialize = exports.deserializeWith = exports.serializeWith = exports.required = exports.ipsoKey = void 0;
const objects_1 = require("alcalzone-shared/objects");
const logger_1 = require("./logger");
// ===========================================================
// define decorators so we can define all properties type-safe
// tslint:disable:variable-name
const METADATA_ipsoKey = Symbol("ipsoKey");
const METADATA_required = Symbol("required");
const METADATA_serializeWith = Symbol("serializeWith");
const METADATA_deserializeWith = Symbol("deserializeWith");
const METADATA_doNotSerialize = Symbol("doNotSerialize");
/**
 * Builds a property transform from a kernel and some options
 * @param kernel The transform kernel
 * @param options Some options regarding the property transform
 */
function buildPropertyTransform(kernel, options = {}) {
    if (options.splitArrays == null)
        options.splitArrays = true;
    if (options.neverSkip == null)
        options.neverSkip = false;
    const ret = kernel;
    ret.splitArrays = options.splitArrays;
    ret.neverSkip = options.neverSkip;
    return ret;
}
/**
 * Defines the ipso key neccessary to serialize a property to a CoAP object
 */
const ipsoKey = (key) => {
    return (target, property) => {
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
exports.ipsoKey = ipsoKey;
/**
 * Looks up previously stored property ipso key definitions.
 * Returns a property name if the key was given, or the key if a property name was given.
 * @param keyOrProperty - ipso key or property name to lookup
 */
function lookupKeyOrProperty(target, keyOrProperty /*| keyof T*/) {
    // get the class constructor
    const constr = target.constructor;
    // retrieve the current metadata
    const metadata = Reflect.getMetadata(METADATA_ipsoKey, constr);
    return metadata && metadata[keyOrProperty];
}
/**
 * Declares that a property is required to be present in a serialized CoAP object
 */
const required = (predicate = true) => {
    return (target, property) => {
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
exports.required = required;
/**
 * Checks if a property is required to be present in a serialized CoAP object
 * @param property - property name to lookup
 */
function isRequired(target, reference, property) {
    // get the class constructor
    const constr = target.constructor;
    logger_1.log(`${constr.name}: checking if ${property} is required...`, "silly");
    // retrieve the current metadata
    const metadata = Reflect.getMetadata(METADATA_required, constr) || {};
    if (metadata.hasOwnProperty(property)) {
        const ret = metadata[property];
        if (typeof ret === "boolean")
            return ret;
        return ret(target, reference);
    }
    return false;
}
/**
 * Checks if a property is required to be present in a serialized CoAP object.
 * In contrast to `isRequired`, this leaves out properties that depend on others.
 * @param property - property name to lookup
 */
function isAlwaysRequired(target, property) {
    // get the class constructor
    const constr = target.constructor;
    logger_1.log(`${constr.name}: checking if ${property} is always required...`, "silly");
    // retrieve the current metadata
    const metadata = Reflect.getMetadata(METADATA_required, constr) || {};
    if (metadata.hasOwnProperty(property)) {
        const ret = metadata[property];
        if (typeof ret === "boolean")
            return ret;
    }
    return false;
}
/**
 * Defines the required transformations to serialize a property to a CoAP object
 * @param kernel The transformation to apply during serialization
 * @param options Some options regarding the behavior of the property transform
 */
function serializeWith(kernel, options) {
    const transform = buildPropertyTransform(kernel, options);
    return (target, property) => {
        // get the class constructor
        const constr = target.constructor;
        // retrieve the current metadata
        const metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};
        metadata[property] = transform;
        // store back to the object
        Reflect.defineMetadata(METADATA_serializeWith, metadata, constr);
    };
}
exports.serializeWith = serializeWith;
// default serializers should not be skipped
const defaultSerializers = {
    Boolean: buildPropertyTransform((bool) => bool ? 1 : 0, { neverSkip: true }),
};
/**
 * Retrieves the serializer for a given property
 */
function getSerializer(target, property /* | keyof T*/) {
    // get the class constructor
    const constr = target.constructor;
    // retrieve the current metadata
    const metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};
    if (metadata.hasOwnProperty(property))
        return metadata[property];
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
function deserializeWith(kernel, options) {
    const transform = buildPropertyTransform(kernel, options);
    return (target, property) => {
        // get the class constructor
        const constr = target.constructor;
        // retrieve the current metadata
        const metadata = Reflect.getMetadata(METADATA_deserializeWith, constr) || {};
        metadata[property] = transform;
        // store back to the object
        Reflect.defineMetadata(METADATA_deserializeWith, metadata, constr);
    };
}
exports.deserializeWith = deserializeWith;
/**
 * Defines that a property will not be serialized
 */
const doNotSerialize = (target, property) => {
    // get the class constructor
    const constr = target.constructor;
    // retrieve the current metadata
    const metadata = Reflect.getMetadata(METADATA_doNotSerialize, constr) || {};
    metadata[property] = true;
    // store back to the object
    Reflect.defineMetadata(METADATA_doNotSerialize, metadata, constr);
};
exports.doNotSerialize = doNotSerialize;
/**
 * Checks if a given property will be serialized or not
 */
function isSerializable(target, property) {
    // get the class constructor
    const constr = target.constructor;
    // retrieve the current metadata
    const metadata = Reflect.getMetadata(METADATA_doNotSerialize, constr) || {};
    // if doNotSerialize is defined, don't serialize!
    return !metadata.hasOwnProperty(property);
}
// default deserializers should not be skipped
const defaultDeserializers = {
    Boolean: buildPropertyTransform((raw) => raw === 1 || raw === "true" || raw === "on" || raw === true, { neverSkip: true }),
};
/**
 * Retrieves the deserializer for a given property
 */
function getDeserializer(target, property /*| keyof T*/) {
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
function getPropertyType(target, property /* | keyof T*/) {
    return Reflect.getMetadata("design:type", target, property);
}
// common base class for all objects that are transmitted somehow
class IPSOObject {
    constructor(options = {}) {
        /** If this object was proxied or not */
        this.isProxy = false;
        this.options = options;
    }
    // // provide an index signature so TypeScript shuts up when using --noImplicitAny
    // [propName: string]: any;
    /**
     * Reads this instance's properties from the given object
     */
    parse(obj) {
        for (const [key, value] of objects_1.entries(obj)) {
            let deserializer = getDeserializer(this, key);
            // key might be ipso key or property name
            let propName; // keyof this | string;
            if (deserializer == null) {
                // deserializers are defined by property name, so key is actually the key
                propName = lookupKeyOrProperty(this, key);
                if (!propName) {
                    logger_1.log(`found unknown property with key ${key}`, "warn");
                    logger_1.log(`object was: ${JSON.stringify(obj)}`, "warn");
                    continue;
                }
                deserializer = getDeserializer(this, propName);
            }
            else {
                // the deserializer was found, so key is actually the property name
                propName = key;
            }
            // parse the value
            const requiresArraySplitting = deserializer ? deserializer.splitArrays : true;
            const parsedValue = this.parseValue(key, value, deserializer, requiresArraySplitting);
            // and remember it - we are now sure propname is a keyof this
            this[propName] = parsedValue;
        }
        return this;
    }
    // parses a value, depending on the value type and defined parsers
    parseValue(propKey /*| symbol*/, value, transform, requiresArraySplitting = true) {
        if (value instanceof Array && requiresArraySplitting) {
            // Array: parse every element
            return value.map(v => this.parseValue(propKey, v, transform, requiresArraySplitting));
        }
        else if (typeof value === "object") {
            // Object: try to parse this, objects should be parsed in any case
            if (transform) {
                return transform(value, this);
            }
            else {
                logger_1.log(`could not find deserializer for key ${propKey}`, "warn");
            }
        }
        else if (transform && (transform.neverSkip || !this.options.skipValueSerializers)) {
            return transform(value, this);
        }
        else {
            // otherwise just return the value
            return value;
        }
    }
    /**
     * Overrides this object's properties with those from another partial one
     */
    merge(obj, allProperties = false) {
        for (const [key, value] of objects_1.entries(obj)) {
            if (allProperties || this.hasOwnProperty(key)) {
                // we can't be sure that this has a property `key`
                this[key] = value;
            }
        }
        return this;
    }
    /** serializes this object in order to transfer it via COAP */
    serialize(reference) {
        // unproxy objects before serialization
        if (this.isProxy)
            return this.unproxy().serialize(reference);
        if (reference != null &&
            reference instanceof IPSOObject &&
            reference.isProxy)
            reference = reference.unproxy();
        const ret = {};
        const serializeValue = (propName, value, refValue, transform) => {
            const _required = isRequired(this, reference, propName);
            let _ret = value;
            if (value instanceof IPSOObject) {
                // if the value is another IPSOObject, then serialize that
                _ret = value.serialize(refValue);
                // if the serialized object contains no required properties, don't remember it
                if (value.isSerializedObjectEmpty(_ret))
                    return null;
            }
            else {
                // if the value is not the default one, then remember it
                if (refValue != null) {
                    if (!_required && refValue === value)
                        return null;
                }
                else {
                    // there is no default value, just remember the actual value
                }
            }
            if (transform && (transform.neverSkip || !this.options.skipValueSerializers)) {
                _ret = transform(_ret, this);
            }
            else if (typeof _ret === "number" && this.options.skipValueSerializers) {
                _ret = Math.round(_ret);
            }
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
                isSerializable(this, propName)) {
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
                    }
                    else {
                        // no reference value, makes things easier
                        value = value.map(v => serializeValue(propName, v, null, serializer));
                    }
                    // now remove null items
                    value = value.filter(v => v != null);
                    if (value.length === 0)
                        value = null;
                }
                else {
                    // directly serialize the value
                    value = serializeValue(propName, value, refValue, serializer);
                }
                // only output the value if it's != null
                // We cannot use !!value here because that would strip out "" and 0
                if (!!key && value != null)
                    ret[key] = value;
            }
        }
        return ret;
    }
    /**
     * Deeply clones an IPSO Object
     */
    clone(...constructorArgs) {
        const constructor = this.constructor;
        const ret = new constructor(this.options, ...constructorArgs);
        // serialize the old values
        const serialized = this.serialize();
        // and parse them back
        return ret.parse(serialized);
    }
    isSerializedObjectEmpty(obj) {
        // Prüfen, ob eine nicht-benötigte Eigenschaft angegeben ist. => nicht leer
        for (const key of Object.keys(obj)) {
            const propName = lookupKeyOrProperty(this, key);
            if (!isAlwaysRequired(this, propName)) {
                return false;
            }
        }
        return true;
    }
    // is overridden inside the proxy
    /** Returns the raw object without a wrapping proxy */
    unproxy() {
        if (this.isProxy) {
            return this.underlyingObject;
        }
        return this;
    }
    /**
     * Creates a proxy for this device
     * @param get Custom getter trap (optional). This is called after mandatory traps are in place and before default behavior
     * @param set Custom setter trap (optional). This is called after mandatory traps are in place and before default behavior
     */
    createProxy(get, set) {
        // per default create a proxy that proxies all IPSOObject instances (single or array)
        return new Proxy(this, {
            get: (me, key) => {
                // add some metadata
                if (key === "isProxy")
                    return true;
                if (key === "underlyingObject")
                    return me;
                if (key === "unproxy")
                    return me.unproxy;
                // if defined, call the overloaded getter
                if (get != null)
                    return get(me, key);
                // else continue with predefined behaviour
                // simply return functions
                if (typeof me[key] === "function") {
                    if (key === "clone") {
                        // clones of proxies should also be proxies
                        return () => me.clone().createProxy();
                    }
                    else {
                        return me[key];
                    }
                }
                // proxy all IPSOObject-Arrays
                if (me[key] instanceof Array &&
                    me[key].length > 0 &&
                    me[key][0] instanceof IPSOObject) {
                    return me[key].map((d) => d.createProxy());
                }
                // proxy all IPSO-Object instances
                if (me[key] instanceof IPSOObject)
                    return me[key].createProxy();
                // return all other properties
                return me[key];
            },
            set: (me, key, value, receiver) => {
                // if defined, call the overloaded setter
                if (set != null)
                    return set(me, key, value, receiver);
                // else continue with predefined behaviour
                // simply set all properties
                me[key] = value;
                return true;
            },
        });
    }
    /**
     * Link this object to a TradfriClient for a simplified API.
     * @internal
     * @param client The client instance to link this object to
     */
    link(client) {
        this.client = client;
        return this;
    }
    /**
     * Fixes property values that are known to be bugged
     */
    fixBuggedProperties() {
        // IPSOObject has none
        return this;
    }
}
__decorate([
    exports.doNotSerialize,
    __metadata("design:type", Object)
], IPSOObject.prototype, "options", void 0);
__decorate([
    exports.doNotSerialize,
    __metadata("design:type", Boolean)
], IPSOObject.prototype, "isProxy", void 0);
__decorate([
    exports.doNotSerialize,
    __metadata("design:type", Object)
], IPSOObject.prototype, "client", void 0);
exports.IPSOObject = IPSOObject;
