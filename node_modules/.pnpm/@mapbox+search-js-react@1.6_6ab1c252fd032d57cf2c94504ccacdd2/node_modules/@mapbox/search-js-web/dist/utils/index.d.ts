/**
 * Returns a random ID that is valid as a CSS identifier.
 *
 * CSS identifiers cannot start with a number, so we prefix the ID with `mbx`.
 */
export declare function randomValidID(): string;
/**
 * Try to parse as a JSON object, returning `null` if it fails.
 */
export declare function tryParseJSON<T>(json: string): T | null;
export declare function deepEquals<T>(a: T, b: T): boolean;
/**
 * Round a number to a given number of digits after the decimal
 * @param num - Number to round
 * @param decimalPlaces - Number of places after the decimal to round to
 * @returns Rounded decimal number
 */
export declare function round(num: number, decimalPlaces: number): number;
/**
 * Returns true if a hostname matches a local server protocol
 * @param hostname - A string representing window.location.hostname
 * @returns A boolean value
 */
export declare function isLocalServer(hostname: string): boolean;
/**
 * Returns true if a hostname matches a Mapbox domain
 * @param hostname - A string representing window.location.hostname
 * @returns A boolean value
 */
export declare function isMapboxDomain(hostname: string): boolean;
