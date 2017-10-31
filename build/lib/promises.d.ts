export declare type PromiseCallback = (value: any) => {} | PromiseLike<any>;
export declare function promisify<T>(fn: any, context?: any): (...args: any[]) => Promise<T>;
export declare function promisifyNoError<T>(fn: any, context?: any): (...args: any[]) => Promise<T>;
export declare function waterfall(...fn: PromiseCallback[]): Promise<any>;
/** Creates a promise that waits for the specified time and then resolves */
export declare function wait(ms: number): Promise<void>;
