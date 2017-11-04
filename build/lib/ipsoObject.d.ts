import { DictionaryLike } from "./object-polyfill";
import { OperationProvider } from "./operation-provider";
export declare type PropertyTransform = (value: any, parent?: IPSOObject) => any;
export declare type RequiredPredicate = (me: IPSOObject, reference: IPSOObject) => boolean;
/**
 * Defines the ipso key neccessary to serialize a property to a CoAP object
 */
export declare const ipsoKey: (key: string) => PropertyDecorator;
/**
 * Declares that a property is required to be present in a serialized CoAP object
 */
export declare const required: (predicate?: boolean | RequiredPredicate) => PropertyDecorator;
/**
 * Defines the required transformations to serialize a property to a CoAP object
 * @param transform: The transformation to apply during serialization
 * @param splitArrays: Whether the serializer expects arrays to be split up in advance
 */
export declare const serializeWith: (transform: PropertyTransform, splitArrays?: boolean) => PropertyDecorator;
export declare const defaultSerializers: DictionaryLike<PropertyTransform>;
/**
 * Defines the required transformations to deserialize a property from a CoAP object
 * @param transform: The transformation to apply during deserialization
 * @param splitArrays: Whether the deserializer expects arrays to be split up in advance
 */
export declare const deserializeWith: (transforms: PropertyTransform | PropertyTransform[], splitArrays?: boolean) => PropertyDecorator;
/**
 * Defines that a property will not be serialized
 */
export declare const doNotSerialize: (target: object, property: string | symbol) => void;
export declare const defaultDeserializers: DictionaryLike<PropertyTransform>;
export declare class IPSOObject {
    /**
     * Reads this instance's properties from the given object
     */
    parse(obj: DictionaryLike<any>): this;
    private parseValue(propKey, value, deserializers?, requiresArraySplitting?);
    /**
     * Overrides this object's properties with those from another partial one
     */
    merge(obj: Partial<this>): this;
    /** serializes this object in order to transfer it via COAP */
    serialize(reference?: any): DictionaryLike<any>;
    /**
     * Deeply clones an IPSO Object
     */
    clone(): this;
    private isSerializedObjectEmpty(obj, refObj);
    /** If this object was proxied or not */
    readonly isProxy: boolean;
    /** Returns the raw object without a wrapping proxy */
    unproxy(): this;
    /**
     * Creates a proxy for this device
     * @param get Custom getter trap (optional). This is called after mandatory traps are in place and before default behavior
     * @param set Custom setter trap (optional). This is called after mandatory traps are in place and before default behavior
     */
    createProxy(get?: (me: this, key: PropertyKey) => any, set?: (me: this, key: PropertyKey, value, receiver) => boolean): this;
    protected client: OperationProvider;
    /**
     * Link this object to a TradfriClient for a simplified API.
     * INTERNAL USE ONLY!
     * @param client The client instance to link this object to
     */
    link(client: OperationProvider): this;
}
