import { LngLat, LngLatLike } from './LngLat';
/**
 * A `LngLatBounds` object represents a geographical bounding box,
 * defined by its southwest and northeast points in longitude and latitude.
 *
 * Note that any method that accepts a `LngLatBounds` object as an argument or option
 * can also accept an `Array` of two {@link LngLatLike} constructs and will perform an implicit conversion.
 * This flexible type is documented as {@link LngLatBoundsLike}.
 *
 * @class LngLatBounds
 */
export declare class LngLatBounds {
    private _ne;
    private _sw;
    /**
     * @param sw - The southwest corner of the bounding box.
     * @param ne - The northeast corner of the bounding box.
     * @example
     * ```typescript
     * const sw = new LngLat(-73.9876, 40.7661);
     * const ne = new LngLat(-73.9397, 40.8002);
     * const llb = new LngLatBounds(sw, ne);
     * ```
     */
    constructor(sw: LngLatLike, ne: LngLatLike);
    /**
     * Returns the southwest corner of the bounding box.
     *
     * @returns The southwest corner of the bounding box.
     * @example
     * ```typescript
     * const llb = new LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.getSouthWest(); // LngLat {lng: -73.9876, lat: 40.7661}
     * ```
     */
    getSouthWest(): LngLat;
    /**
     * Returns the northeast corner of the bounding box.
     *
     * @returns The northeast corner of the bounding box.
     * @example
     * ```typescript
     * const llb = new LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.getNorthEast(); // LngLat {lng: -73.9397, lat: 40.8002}
     * ```
     */
    getNorthEast(): LngLat;
    /**
     * Returns the northwest corner of the bounding box. This is commonly used
     * as the 'min' point in the bounding box.
     *
     * @returns The northwest corner of the bounding box.
     * @example
     * ```typescript
     * const llb = new LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.getNorthWest(); // LngLat {lng: -73.9876, lat: 40.8002}
     * ```
     */
    getNorthWest(): LngLat;
    /**
     * Returns the southeast corner of the bounding box. This is commonly used
     * as the 'max' point in the bounding box.
     *
     * @returns The southeast corner of the bounding box.
     * @example
     * ```typescript
     * const llb = new LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.getSouthEast(); // LngLat {lng: -73.9397, lat: 40.7661}
     * ```
     */
    getSouthEast(): LngLat;
    /**
     * Returns the west edge of the bounding box.
     *
     * @returns The west edge of the bounding box.
     * @example
     * ```typescript
     * const llb = new LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.getWest(); // -73.9876
     * ```
     */
    getWest(): number;
    /**
     * Returns the south edge of the bounding box.
     *
     * @returns The south edge of the bounding box.
     * @example
     * ```typescript
     * const llb = new LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.getSouth(); // 40.7661
     * ```
     */
    getSouth(): number;
    /**
     * Returns the east edge of the bounding box.
     *
     * @returns The east edge of the bounding box.
     * @example
     * ```typescript
     * const llb = new LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.getEast(); // -73.9397
     * ```
     */
    getEast(): number;
    /**
     * Returns the north edge of the bounding box.
     *
     * @returns The north edge of the bounding box.
     * @example
     * ```typescript
     * const llb = new LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.getNorth(); // 40.8002
     * ```
     */
    getNorth(): number;
    /**
     * Returns the bounding box represented as an array.
     *
     * @returns The bounding box represented as an array, consisting of the
     *   southwest and northeast coordinates of the bounding represented as arrays of numbers.
     * @example
     * ```typescript
     * const llb = new LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.toArray(); // = [[-73.9876, 40.7661], [-73.9397, 40.8002]]
     * ```
     */
    toArray(): [[number, number], [number, number]];
    /**
     * Returns the bounding box represented as a flattened array.
     *
     * @returns The bounding box represented as an array of numbers in [west, south, east, north] order.
     * @example
     * ```typescript
     * const llb = new LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.toFlatArray(); // = [-73.9876, 40.7661, -73.9397, 40.8002]
     * ```
     */
    toFlatArray(): [number, number, number, number];
    /**
     * Return the bounding box represented as a string.
     *
     * @returns The bounding box represents as a string of the format
     *   `'LngLatBounds(LngLat(lng, lat), LngLat(lng, lat))'`.
     * @example
     * ```typescript
     * const llb = new LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.toString(); // = "LngLatBounds(LngLat(-73.9876, 40.7661), LngLat(-73.9397, 40.8002))"
     * ```
     */
    toString(): string;
    /**
     * Converts an array to a `LngLatBounds` object.
     *
     * If a `LngLatBounds` object is passed in, the function returns a copy.
     *
     * Internally, the function calls `LngLat#convert` to convert arrays to `LngLat` values.
     *
     * @param input - An array of two coordinates to convert, or a `LngLatBounds` object to return.
     * @returns A new `LngLatBounds` object, if a conversion occurred, or the original `LngLatBounds` object.
     * @example
     * ```typescript
     * const arr = [[-73.9876, 40.7661], [-73.9397, 40.8002]];
     * const llb = LngLatBounds.convert(arr);
     * console.log(llb);   // = LngLatBounds {_sw: LngLat {lng: -73.9876, lat: 40.7661}, _ne: LngLat {lng: -73.9397, lat: 40.8002}}
     * ```
     */
    static convert(input: LngLatBounds | [LngLatLike, LngLatLike] | [number, number, number, number]): LngLatBounds;
}
/**
 * A {@link LngLatBounds} object, an array of {@link LngLatLike} objects in [sw, ne] order,
 * or an array of numbers in [west, south, east, north] order.
 *
 * @typedef LngLatBoundsLike
 * @type {LngLatBounds | [LngLatLike, LngLatLike] | [number, number, number, number]}
 * @example
 * ```typescript
 * const v1 = new LngLatBounds(
 *   new LngLat(-73.9876, 40.7661),
 *   new LngLat(-73.9397, 40.8002)
 * );
 * const v2 = new LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
 * const v3 = [[-73.9876, 40.7661], [-73.9397, 40.8002]];
 * ```
 */
export declare type LngLatBoundsLike = LngLatBounds | [LngLatLike, LngLatLike] | [number, number, number, number];
