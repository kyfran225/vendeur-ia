/**
 * A `LngLat` object represents a given longitude and latitude coordinate, measured in degrees.
 * These coordinates use longitude, latitude coordinate order (as opposed to latitude, longitude)
 * to match the [GeoJSON specification](https://datatracker.ietf.org/doc/html/rfc7946#section-4),
 * which is equivalent to the OGC:CRS84 coordinate reference system.
 *
 * Note that any method that accepts a `LngLat` object as an argument or option
 * can also accept an `Array` of two numbers and will perform an implicit conversion.
 * This flexible type is documented as {@link LngLatLike}.
 *
 * @class LngLat
 * @param lng - Longitude, measured in degrees.
 * @param lat - Latitude, measured in degrees.
 * @example
 * ```typescript
 * const ll = new LngLat(-123.9749, 40.7736);
 * console.log(ll.lng); // = -123.9749
 * ```
 */
export declare class LngLat {
    /**
     * @name lng
     * @instance
     * @memberof LngLat
     */
    readonly lng: number;
    /**
     * @name lat
     * @instance
     * @memberof LngLat
     */
    readonly lat: number;
    constructor(lng: number, lat: number);
    /**
     * Returns the coordinates represented as an array of two numbers.
     *
     * @returns The coordinates represeted as an array of longitude and latitude.
     * @example
     * ```typescript
     * const ll = new LngLat(-73.9749, 40.7736);
     * ll.toArray(); // = [-73.9749, 40.7736]
     * ```
     */
    toArray(): [number, number];
    /**
     * Returns the coordinates represent as a string.
     *
     * @returns The coordinates represented as a string of the format `'LngLat(lng, lat)'`.
     * @example
     * ```typescript
     * const ll = new LngLat(-73.9749, 40.7736);
     * ll.toString(); // = "LngLat(-73.9749, 40.7736)"
     * ```
     */
    toString(): string;
    /**
     * Converts an array of two numbers or an object with `lng` and `lat` or `lon` and `lat` properties
     * to a `LngLat` object.
     *
     * If a `LngLat` object is passed in, the function returns a copy.
     *
     * @param input - An array of two numbers or object to convert, or a `LngLat` object to return.
     * @returns A new `LngLat` object, if a conversion occurred, or the original `LngLat` object.
     * @example
     * ```typescript
     * const arr = [-73.9749, 40.7736];
     * const ll = LngLat.convert(arr);
     * console.log(ll);   // = LngLat {lng: -73.9749, lat: 40.7736}
     * ```
     */
    static convert(input: LngLat | {
        lng: number;
        lat: number;
    } | {
        lon: number;
        lat: number;
    } | [number, number]): LngLat;
}
/**
 * A {@link LngLat} object, an array of two numbers representing longitude and latitude,
 * or an object with `lng` and `lat` or `lon` and `lat` properties.
 *
 * @typedef LngLatLike
 * @type {LngLat | [number, number] | { lng: number, lat: number } | { lon: number, lat: number }}
 * @example
 * ```typescript
 * const v1 = new LngLat(-122.420679, 37.772537);
 * const v2 = [-122.420679, 37.772537];
 * const v3 = {lon: -122.420679, lat: 37.772537};
 * ```
 */
export declare type LngLatLike = LngLat | {
    lng: number;
    lat: number;
} | {
    lon: number;
    lat: number;
} | [number, number];
