declare type Primitive = string | number | boolean | null;
/**
 * tl;dr - [classnames](https://www.npmjs.com/package/classnames) for query parameters.
 *
 * Encodes query parameters into a stringified form, good for use with {@link URL#search}.
 * Objects are key-value pairs, and if a falsy object is passed, it will be omitted.
 *
 * Null and undefined values are ignored.
 * Array values are encoded as comma-separated values.
 *
 * @example
 * ```typescript
 * const limit = 0;
 * const offset = null;
 * const params = queryParams(
 *  {
 *    q: 'pizza',
 *    c: null
 *  },
 *  (limit != null) && { limit },
 *  (offset != null) && { offset }
 * );
 * console.log(params); // = 'q=pizza&limit=0'
 * ```
 */
export declare function queryParams<T extends Record<string, Primitive>>(...objects: (T | false)[]): string;
export {};
