export declare const UNKNOWN_ERROR = "Unknown error";
/**
 * Thrown from Search JS Core functions when a network request fails.
 *
 * See common errors here:
 * - [SearchBoxCore](https://docs.mapbox.com/api/search/search-box/#search-box-api-errors)
 * - [AddressAutofillCore](https://docs.mapbox.com/api/search/geocoding-v6/#geocoding-api-errors)
 */
export declare class MapboxError extends Error {
    readonly statusCode: number;
    constructor(json: Record<string, unknown>, statusCode: number);
    /**
     * Modified Error toString() method to include the status code.
     */
    toString(): string;
}
/**
 * Utility function to see if the result is "ok" (in 200 range).
 *
 * If not, throw a {@link MapboxError} filled out by the
 * [JSON error format](https://docs.mapbox.com/api/search/search-box/#search-box-api-errors).
 */
export declare function handleNonOkRes(res: Response): Promise<void>;
