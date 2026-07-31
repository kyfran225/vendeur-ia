import { AddressAutofillSuggestion, AddressAutofillFeatureSuggestion } from './types';
import { LngLatLike } from '../LngLat';
import { LngLatBoundsLike } from '../LngLatBounds';
import { SessionTokenLike } from '../SessionToken';
interface AccessTokenOptions {
    /**
     * The [Mapbox access token](https://docs.mapbox.com/help/glossary/access-token/) to use for all requests.
     */
    accessToken: string;
}
interface FetchOptions {
    /**
     * If specified, the connected {@link AbortController} can be used to
     * abort the current network request(s).
     *
     * This mechanism intentionally works in the same way as the
     * [`fetch` API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API#aborting_a_fetch).
     *
     * Reference:
     * https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal#examples
     */
    signal?: AbortSignal;
}
interface SessionTokenOptions {
    /**
     * A customer-provided session token value, which groups a series of requests together for [billing purposes](https://www.mapbox.com/pricing#autofill-session).
     *
     * Reference:
     * https://www.mapbox.com/pricing#autofill-session
     */
    sessionToken: SessionTokenLike;
}
/**
 * Options used by {@link AddressAutofillCore} and {@link useAddressAutofillCore} to control the location, language, country, and limit of results. All properties are optional.
 *
 * @typedef {Object} AddressAutofillOptions
 * @property {string} language The [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag) to be returned. If not specified, `en` will be used.
 * @property {string} country An [ISO 3166 alpha-2 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) to be returned. If not specified, results will not be filtered by country.
 * @property {string | LngLatBoundsLike} bbox Limit results to only those contained within the supplied bounding box.
 * @property {string | number} limit The number of results to return, up to `10`.
 * @property {string | LngLatLike} proximity Bias the response to favor results that are closer to this location. Provide a point coordinate provided as a{@link LngLatLike}, or use the string `ip` to use the requester's IP address.
 * @property {string | boolean} streets If enabled, street results may be returned in addition to addresses. Defaults to `true`.
 */
export interface AddressAutofillOptions {
    language: string;
    country: string;
    bbox: string | LngLatBoundsLike;
    limit: string | number;
    proximity: string | LngLatLike;
    streets: string | boolean;
}
/**
 * Response object returned when calling the `suggest` method of {@link AddressAutofillCore}
 * @typedef AddressAutofillSuggestionResponse
 */
export interface AddressAutofillSuggestionResponse {
    /**
     * The attribution data for results.
     */
    attribution?: string;
    /**
     * The returned suggestion objects.
     *
     * @see {@link Suggestion}
     */
    suggestions: AddressAutofillSuggestion[];
    url?: string;
}
/**
 * Response object returned when calling the `retrieve` method of {@link AddressAutofillCore}
 * @typedef AddressAutofillRetrieveResponse
 */
export interface AddressAutofillRetrieveResponse {
    type: 'FeatureCollection';
    /**
     * The attribution data for results.
     */
    attribution?: string;
    /**
     * The returned feature objects.
     *
     * @see {@link FeatureSuggestion}
     */
    features: AddressAutofillFeatureSuggestion[];
    url?: string;
}
/**
 * A `AddressAutofillCore` object is an application's main entrypoint to the
 * Mapbox Address Autofill API. The Mapbox Address Autofill API is an API similar to {@link SearchBoxCore},
 * but targeted towards **address** autocomplete.
 *
 * Only address types are returned by the API.
 *
 * `AddressAutofillCore` is focused on the two-step, interactive search experience. These steps are:
 *   1. {@link AddressAutofillCore#suggest}: The user enters a search term, and a list of suggested results is returned with
 *     address data.
 *   2. {@link AddressAutofillCore#retrieve}: The user selects a result from the list of suggested results, and the
 *     corresponding geographic coordinates are returned.
 *
 * A [Mapbox access token](https://docs.mapbox.com/help/glossary/access-token/) is required to use `AddressAutofillCore`, and
 * other options may be specified either in the constructor or in the {@link AddressAutofillCore#suggest} call.
 *
 * @class AddressAutofillCore
 * @param {AddressAutofillOptions} [options]
 * @param {string} [options.accessToken]
 */
export declare class AddressAutofillCore {
    #private;
    static defaults: Partial<AddressAutofillOptions>;
    /**
     * The [Mapbox access token](https://docs.mapbox.com/help/glossary/access-token/) to use for all requests.
     */
    accessToken: string;
    /**
     * Any default options ({@link AddressAutofillOptions}) to be merged into options in the following methods:
     * - {@link AddressAutofillCore#suggest}
     *
     * @type {AddressAutofillOptions}
     */
    defaults: Partial<AddressAutofillOptions>;
    get responseHeaders(): Headers;
    constructor(options?: Partial<AccessTokenOptions & AddressAutofillOptions>);
    /** @section {Methods} */
    /**
     * {@link AddressAutofillCore#suggest} is "part one" of the two-step autofill experience, and includes
     * autofill information.
     *
     * Suggestion objects **do not include geographic coordinates**. To get the coordinates of the result, use {@link AddressAutofillCore#retrieve}.
     *
     * For tracking purposes, it is useful for any follow-up requests based on this suggestion to include same
     * {@link SessionToken} as the original request.
     *
     * If you'd like session tokens to be handled automatically, see {@link SearchSession}.
     *
     * @param {AddressAutofillOptions} optionsArg
     * @param {SessionTokenLike} optionsArg.sessionToken
     * @param {AbortSignal} [optionsArg.signal]
     */
    suggest(searchText: string, optionsArg: SessionTokenOptions & Partial<FetchOptions & AddressAutofillOptions>): Promise<AddressAutofillSuggestionResponse>;
    /**
     * {@link AddressAutofillCore#retrieve} is "part two" of the two-step autofill experience and includes
     * geographic coordinates in [GeoJSON](https://docs.mapbox.com/help/glossary/geojson/) format.
     *
     * {@link suggestion} is usually a {@link AddressAutofillSuggestion} returned from "part one,"
     * {@link AddressAutofillCore#suggest}.
     *
     * **Legal terms:**
     *
     * Geographic coordinates should be used ephemerally and not persisted.
     *
     * This permanent policy is consistent with the [Mapbox Terms of Service](https://www.mapbox.com/tos/) and failure to comply
     * may result in modified or discontinued service.
     *
     * Additionally, the [Mapbox Terms of Service](https://www.mapbox.com/tos/) states any rendering of a feature suggestion
     * must be using Mapbox map services (for example, displaying results on Google Maps or MapKit JS is not allowed).
     *
     * **Disclaimer:**
     *
     * The failure of Mapbox to exercise or enforce any right or provision of these Terms will not constitute a waiver of such right or provision.
     *
     * @param {AddressAutofillOptions} optionsArg
     * @param {SessionTokenLike} optionsArg.sessionToken
     * @param {AbortSignal} [optionsArg.signal]
     */
    retrieve(suggestion: AddressAutofillSuggestion, optionsArg: SessionTokenOptions & Partial<FetchOptions>): Promise<AddressAutofillRetrieveResponse>;
    /**
     * Returns true if {@link AddressAutofillCore#retrieve} can be called on this suggestion,
     * false otherwise.
     */
    canRetrieve(suggestion: AddressAutofillSuggestion): boolean;
}
export {};
