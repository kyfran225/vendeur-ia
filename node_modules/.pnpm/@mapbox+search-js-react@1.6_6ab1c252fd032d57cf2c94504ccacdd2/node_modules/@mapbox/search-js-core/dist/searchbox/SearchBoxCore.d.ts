import { SearchBoxAdministrativeUnitTypes, SearchBoxSuggestion, SearchBoxFeatureSuggestion, SearchBoxCategorySuggestion } from './types';
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
     * This mechanism works in the same way as the [`fetch` API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API#aborting_a_fetch).
     *
     * Reference:
     * https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal#examples
     */
    signal?: AbortSignal;
}
/**
 * Options object to configure a {@link SearchBoxCore} instance that is driven by a web component.
 * @typedef ComponentOptions
 */
interface ComponentOptions {
    /**
     * Allow the user to query a coordinate string (e.g. "lng,lat") to get a reverse search result.
     */
    allowReverse?: boolean;
    /**
     * If true, the coordinates in the query string are expected to be (lat,lng) instead of (lng,lat).
     */
    flipCoordinates?: boolean;
}
interface SessionTokenOptions {
    /**
     * A customer-provided session token value, which groups a series of requests
     * together for [billing purposes](https://docs.mapbox.com/api/search/search-box/#search-box-api-pricing).
     *
     * Reference:
     * https://docs.mapbox.com/api/search/search-box/#search-box-api-pricing
     */
    sessionToken: SessionTokenLike;
}
/**
 * Options object for configuring {@link SearchBoxCore}, mapped to {@link https://docs.mapbox.com/api/search/search-box/|Search Box API} parameters.
 * @typedef SearchBoxOptions
 */
export interface SearchBoxOptions {
    /**
     * The [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag) to be returned.
     *
     * If not specified, `en` will be used.
     */
    language?: string;
    /**
     * The number of results to return, up to `10`.
     */
    limit?: string | number;
    /**
     * Bias the response to favor results that are closer to this location.
     *
     * When both {@link SearchBoxOptions#proximity} and {@link SearchBoxOptions#origin} are specified, `origin` is interpreted as the
     * target of a route, while `proximity` indicates the current user location.
     */
    proximity?: string | LngLatLike;
    /**
     * The location from which to calculate distance. **This parameter may incur additional latency.**
     *
     * When both {@link SearchBoxOptions#proximity} and {@link SearchBoxOptions#origin} are specified, `origin` is interpreted as the
     * target of a route, while `proximity` indicates the current user location.
     *
     * For distance calculations, both {@link SearchBoxOptions#navigation_profile} and
     * {@link SearchBoxOptions#origin} must be specified.
     *
     * For ETA calculations: {@link SearchBoxOptions#navigation_profile},
     * {@link SearchBoxOptions#origin}, and {@link SearchBoxOptions#eta_type} must be specified.
     */
    origin?: string | LngLatLike;
    /**
     * Limit results to only those contained within the supplied bounding box.
     */
    bbox?: string | LngLatBoundsLike;
    /**
     * The navigation routing profile to use for distance/eta calculations.
     *
     * For distance calculations, both {@link SearchBoxOptions#navigation_profile} and
     * {@link SearchBoxOptions#origin} must be specified.
     *
     * For ETA calculations: {@link SearchBoxOptions#navigation_profile},
     * {@link SearchBoxOptions#origin}, and {@link SearchBoxOptions#eta_type} must be specified.
     */
    navigation_profile?: 'driving' | 'walking' | 'cycling';
    /**
     * A polyline encoded linestring describing the route to be used for searching.
     *
     * Both polyline5 and polyline6 precision are accepted, but must be specified using the {@link SearchBoxOptions#route_geometry} parameter.
     */
    route?: string;
    /**
     * Passed in conjunction with a route polyline describing its precision. Options are polyline or polyline6. If this parameter is not provided with a {@link SearchBoxOptions#route}, the default is polyline.
     *
     * Accurate results depend on including the correct route_geometry for the {@link SearchBoxOptions#route} provided.
     */
    route_geometry?: string;
    /**
     * This indicates that the user intends to perform a higher cost search-along-route request.
     *
     * This should be included when {@link SearchBoxOptions#route} is included and should have a value of isochrone.
     */
    sar_type?: string;
    /**
     * Maximum detour in estimated minutes from route.
     */
    time_deviation?: string | number;
    /**
     * Used to estimate the time of arrival from the location specified in {@link SearchBoxOptions#origin}.
     *
     * The only allowed value for this parameter is navigation. This parameter, along with {@link SearchBoxOptions#origin} and {@link SearchBoxOptions#navigation_profile}, is required for ETA calculations.
     *
     * ETA calculations will incur additional latency.
     */
    eta_type?: 'navigation';
    /**
     * An [ISO 3166 alpha-2 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) to be returned.
     *
     * If not specified, results will not be filtered by country.
     */
    country?: string;
    /**
     * Limit results to one or more types of features. If no types are specified, all possible types may be returned.
     *
     * Reference:
     * https://docs.mapbox.com/api/search/search-box/#administrative-unit-types
     */
    types?: string | Set<SearchBoxAdministrativeUnitTypes>;
    /**
     * Limit results to those that belong to one or more categories, provided as a comma-separated list.
     */
    poi_category?: string;
    /**
     * A comma-separated list of rich metadata providers to include in a suggestion result.
     */
    rich_metadata_provider?: string;
    /**
     * A comma-separated list of canonical category names that limits POI results to those that are not part of the given categories.
     */
    poi_category_exclusions?: string;
}
/**
 * A `SearchBoxSuggestionResponse` object represents a returned data object from the `suggest` endpoint of the [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/#response-get-suggested-results).
 *
 * @typedef SearchBoxSuggestionResponse
 * Reference:
 * https://docs.mapbox.com/api/search/search-box/#response-get-suggested-results
 */
export interface SearchBoxSuggestionResponse {
    /**
     * The attribution data for results.
     */
    attribution?: string;
    /**
     * The returned suggestion objects.
     *
     * @see {@link SearchBoxSuggestion}
     */
    suggestions: SearchBoxSuggestion[];
    url?: string;
}
/**
 * A `SearchBoxRetrieveResponse` object represents a returned data object from the `/retrieve` endpoint of the [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/#response-retrieve-a-suggested-feature).
 *
 * @typedef SearchBoxRetrieveResponse
 * Reference:
 * https://docs.mapbox.com/api/search/search-box/#response-retrieve-a-suggested-feature
 */
export interface SearchBoxRetrieveResponse {
    type: 'FeatureCollection';
    /**
     * The attribution data for results.
     */
    attribution?: string;
    /**
     * The returned feature objects.
     *
     * @see {@link SearchBoxFeatureSuggestion}
     */
    features: SearchBoxFeatureSuggestion[];
    url?: string;
}
/**
 * @typedef SearchBoxReverseResponse
 * Reference:
 * https://docs.mapbox.com/api/search/search-box/#response-perform-a-reverse-lookup
 */
export interface SearchBoxReverseResponse {
    type: 'FeatureCollection';
    /**
     * The attribution data for results.
     */
    attribution?: string;
    /**
     * The returned feature objects.
     *
     * @see {@link SearchBoxFeatureSuggestion}
     */
    features: SearchBoxFeatureSuggestion[];
    url?: string;
}
/**
 * @typedef SearchBoxCategoryResponse
 * Reference:
 * https://docs.mapbox.com/api/search/search-box/#response-retrieve-pois-by-category
 */
export interface SearchBoxCategoryResponse {
    type: 'FeatureCollection';
    /**
     * The attribution data for results.
     */
    attribution?: string;
    /**
     * The returned feature objects.
     *
     * @see {@link SearchBoxCategorySuggestion}
     */
    features: SearchBoxCategorySuggestion[];
    url?: string;
}
/**
 * A `SearchBoxCore` object is an application's main entrypoint to the [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/).
 *
 * `SearchBoxCore` is focused on the two-step, interactive search experience. These steps are:
 *   1. {@link SearchBoxCore#suggest}: The user enters a search term, and a list of suggested results is returned with
 *      optional data such as: eta, distance calculations, etc.
 *   2. {@link SearchBoxCore#retrieve}: The user selects a result from the list of suggested results, and the
 *     corresponding geographic coordinates are returned for displaying on a map or otherwise manipulating.
 *
 * A [Mapbox access token](https://docs.mapbox.com/help/glossary/access-token/) is required to use `SearchBoxCore`, and
 * other options may be specified either in the constructor or in the {@link SearchBoxCore#suggest} call.
 *
 * @class SearchBoxCore
 * @param {SearchBoxOptions} [options]
 * @param {string} [options.accessToken]
 *
 * @example
 * ```typescript
 * const search = new SearchBoxCore({ accessToken: 'pk.my-mapbox-access-token' });
 *
 * const sessionToken = new SessionToken();
 * const result = await search.suggest('Washington D.C.', { sessionToken });
 * if (result.suggestions.length === 0) return;
 *
 * const suggestion = result.suggestions[0];
 * const { features } = await search.retrieve(suggestion, { sessionToken });
 * doSomethingWithCoordinates(features);
 * ```
 */
export declare class SearchBoxCore {
    #private;
    static defaults: Partial<SearchBoxOptions>;
    /**
     * The [Mapbox access token](https://docs.mapbox.com/help/glossary/access-token/) to use for all requests.
     */
    accessToken: string;
    /**
     * Any default options ({@link SearchBoxOptions}) to be merged into options in the following methods:
     * - {@link SearchBoxCore#suggest}
     * - {@link SearchBoxCore#retrieve}
     * - {@link SearchBoxCore#reverse}
     */
    defaults: Partial<SearchBoxOptions>;
    constructor(options?: Partial<AccessTokenOptions & SearchBoxOptions>);
    /** @section {Interactive search} */
    /**
     * {@link SearchBoxCore#suggest} is "part one" of the two-step interactive search experience, and includes
     * useful information such as: {@link SearchBoxSuggestion#name}, {@link SearchBoxSuggestion#place_formatted}, and {@link SearchBoxSuggestion#maki}.
     *
     * Suggestion objects **do not include geographic coordinates**. To get the coordinates of the result, use {@link SearchBoxCore#retrieve}.
     *
     * For tracking purposes, it is useful for any follow-up requests based on this suggestion to include same
     * {@link SessionToken} as the original request.
     *
     * If you'd like session tokens to be handled automatically, see {@link SearchSession}.
     *
     * @param {string} searchText
     * @param {SearchBoxOptions} optionsArg
     * @param {SessionTokenLike} optionsArg.sessionToken
     * @param {AbortSignal} [optionsArg.signal]
     */
    suggest(searchText: string, optionsArg: SessionTokenOptions & Partial<FetchOptions & SearchBoxOptions & ComponentOptions>): Promise<SearchBoxSuggestionResponse>;
    /**
     * {@link SearchBoxCore#retrieve} is "part two" of the two-step interactive search experience and includes
     * geographic coordinates in [GeoJSON](https://docs.mapbox.com/help/glossary/geojson/) format.
     *
     * `suggestion` is usually a {@link SearchBoxSuggestion} returned from "part one," {@link SearchBoxCore#suggest}.
     *
     * Multiple feature suggestions may be returned from a single search query, for example in an airport with
     * multiple terminals.
     *
     * **Legal terms:**
     *
     * The [Mapbox Terms of Service](https://www.mapbox.com/tos/) states any rendering of a feature suggestion
     * must be using Mapbox map services (for example, displaying results on Google Maps or MapKit JS is not allowed).
     *
     * **Disclaimer:**
     *
     * The failure of Mapbox to exercise or enforce any right or provision of these Terms will not constitute a waiver of such right or provision.
     *
     * @param {any} optionsArg
     * @param {SessionTokenLike} optionsArg.sessionToken
     * @param {AbortSignal} [optionsArg.signal]
     */
    retrieve(suggestion: SearchBoxSuggestion, optionsArg: SessionTokenOptions & Partial<FetchOptions & Pick<SearchBoxOptions, 'language'>>): Promise<SearchBoxRetrieveResponse>;
    /** @section {Programmatic search} */
    /**
     * {@link SearchBoxCore#category} makes it possible to browse entire categories of results,
     * like coffee shops, hotels, and bookstores around a specific location or along a route and returns feature collection
     * in [GeoJSON](https://docs.mapbox.com/help/glossary/geojson/) format.
     *
     * **Legal terms:**
     *
     * The [Mapbox Terms of Service](https://www.mapbox.com/tos/) states any rendering of a feature suggestion
     * must be using Mapbox map services (for example, displaying results on Google Maps or MapKit JS is not allowed).
     *
     * **Disclaimer:**
     *
     * The failure of Mapbox to exercise or enforce any right or provision of these Terms will not constitute a waiver of such right or provision.
     *
     * @param {Options} optionsArg
     * @param {AbortSignal} [optionsArg.signal]
     * @param {boolean} [optionsArg.permanent]
     */
    category(category: string, optionsArg?: Partial<FetchOptions & SearchBoxOptions>): Promise<SearchBoxCategoryResponse>;
    /**
     * {@link SearchBoxCore#reverse} endpoint allows you to look up a single pair of coordinates and returns the geographic feature or features
     * that exist at that location. The response to a request is a [GeoJSON](https://docs.mapbox.com/help/glossary/geojson/) FeatureCollection.
     *
     * Using the limit parameter, you can increase the maximum number of results up to 10. Pagination is not available, but this feature may be added in a later release.
     * There is not an option to customize the order of search results.
     *
     * Multiple feature suggestions may be returned from a single search query, for example in an airport with
     * multiple terminals.
     *
     * **Legal terms:**
     *
     * The [Mapbox Terms of Service](https://www.mapbox.com/tos/) states any rendering of a feature suggestion
     * must be using Mapbox map services (for example, displaying results on Google Maps or MapKit JS is not allowed).
     *
     * **Disclaimer:**
     *
     * The failure of Mapbox to exercise or enforce any right or provision of these Terms will not constitute a waiver of such right or provision.
     *
     * @param lngLat - Either a {@link LngLatLike} object or string in 'lng,lat' comma-separated format.
     * @param {Options} optionsArg
     * @param {AbortSignal} [optionsArg.signal]
     */
    reverse(lngLat: string | LngLatLike, optionsArg?: Partial<FetchOptions & SearchBoxOptions>): Promise<SearchBoxReverseResponse>;
}
export {};
