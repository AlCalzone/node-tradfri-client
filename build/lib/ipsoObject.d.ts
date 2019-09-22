import { OperationProvider } from "./operation-provider";
export declare type PropertyTransformKernel = (value: any, parent?: IPSOObject) => any;
export interface PropertyTransform extends PropertyTransformKernel {
    /** If this transform is not supposed to be skipped ever */
    neverSkip: boolean;
    /** If this transform requires arrays to be split */
    splitArrays: boolean;
}
export declare type RequiredPredicate = (me: IPSOObject, reference?: IPSOObject) => boolean;
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
 * @param kernel The transformation to apply during serialization
 * @param options Some options regarding the behavior of the property transform
 */
export declare function serializeWith(kernel: PropertyTransformKernel, options?: {
    splitArrays?: boolean;
    neverSkip?: boolean;
}): PropertyDecorator;
/**
 * Defines the required transformations to deserialize a property from a CoAP object
 * @param kernel The transformation to apply during deserialization
 * @param options Options for deserialisation
 */
export declare function deserializeWith(kernel: PropertyTransformKernel, options?: {
    splitArrays?: boolean;
    neverSkip?: boolean;
}): PropertyDecorator;
/**
 * Defines that a property will not be serialized
 */
export declare const doNotSerialize: <T extends IPSOObject>(target: T, property: string | keyof T) => void;
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
export declare class IPSOObject {
    constructor(options?: IPSOOptions);
    /**
     * Reads this instance's properties from the given object
     */
    parse(obj: Record<string, any>): this;
    private parseValue;
    /**
     * Overrides this object's properties with those from another partial one
     */
    merge(obj: Partial<this>, allProperties?: boolean): this;
    /** serializes this object in order to transfer it via COAP */
    serialize(reference?: this): Record<string, any>;
    /**
     * Deeply clones an IPSO Object
     */
    clone(...constructorArgs: any[]): this;
    private isSerializedObjectEmpty;
    /** If this object was proxied or not */
    readonly isProxy: boolean;
    /** Returns the raw object without a wrapping proxy */
    unproxy(): this;
    /**
     * Creates a proxy for this device
     * @param get Custom getter trap (optional). This is called after mandatory traps are in place and before default behavior
     * @param set Custom setter trap (optional). This is called after mandatory traps are in place and before default behavior
     */
    createProxy(get?: (me: this, key: PropertyKey) => any, set?: (me: this, key: PropertyKey, value: any, receiver: any) => boolean): this;
    protected client: OperationProvider | undefined;
    /**
     * Fixes property values that are known to be bugged
     */
    fixBuggedProperties(): this;
}
