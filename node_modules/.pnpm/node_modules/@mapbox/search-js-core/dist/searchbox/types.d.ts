/**
 * Administrative unit types for the [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/).
 *
 * @typedef SearchBoxAdministrativeUnitTypes
 * @see https://docs.mapbox.com/api/search/search-box/#administrative-unit-types
 */
export declare type SearchBoxAdministrativeUnitTypes = 'country' | 'region' | 'postcode' | 'district' | 'place' | 'locality' | 'neighborhood' | 'street' | 'address' | 'block';
export interface ContextEntry {
    id: string;
    name: string;
}
/**
 * Raw JSON form of a suggestion result's "context" from the [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/).
 *
 * Reference:
 * https://docs.mapbox.com/api/search/search-box/#response-get-suggested-results
 */
export interface SuggestionJSONContext {
    /**
     * The country of the result
     */
    country?: ContextEntry & {
        /**
         * the ISO_3166_1 alpha 2 code)
         */
        country_code: string;
        /**
         * the ISO_3166_1 alpha 3 code
         */
        country_code_alpha_3: string;
    };
    /**
     * 	The region of the result
     */
    region?: ContextEntry & {
        region_code: string;
        /**
         * the ISO_3166_2 code
         */
        region_code_full: string;
    };
    /**
     * The postcode of the result
     */
    postcode?: ContextEntry;
    /**
     * The district of the result
     */
    district?: ContextEntry;
    /**
     * The place of the result
     */
    place?: ContextEntry;
    /**
     * The locality of the result
     */
    locality?: ContextEntry;
    /**
     * The neighborhood of the result
     */
    neighborhood?: ContextEntry;
    /**
     * The address of the result including the address number and street
     */
    address?: ContextEntry;
    /**
     * The address number of the result
     */
    address_number?: ContextEntry;
    /**
     * The street of the result
     */
    street?: ContextEntry;
}
/**
 * A `SearchBoxSuggestion` object represents a suggestion result from the [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/).
 *
 * SearchBoxSuggestion objects are "part one" of the two-step interactive search experience, and include useful information about the result,
 * such as: {@link SearchBoxSuggestion#name}, {@link SearchBoxSuggestion#full_address}, and {@link SearchBoxSuggestion#maki}.
 *
 * SearchBoxSuggestion objects do not include geographic coordinates. To get the coordinates of the result, use {@link SearchBoxCore#retrieve}.
 *
 * For tracking purposes, it is useful for any follow-up requests based on this suggestion to include same
 * {@link SessionToken} as the original request.
 *
 * Reference:
 * https://docs.mapbox.com/api/search/search-box/#response-get-suggested-results
 *
 * @typedef SearchBoxSuggestion
 * @example
 * ```typescript
 * const search = new SearchBoxCore({ accessToken: 'pk.my-mapbox-access-token' });
 *
 * const sessionToken = new SessionToken();
 * const result = await search.suggest('Washington D.C.', { sessionToken });
 * if (result.suggestions.length === 0) return;
 *
 * const suggestion = result.suggestions[0];
 *
 * const { features } = await search.retrieve(suggestion, { sessionToken });
 * doSomethingWithCoordinates(features);
 * ```
 */
export interface SearchBoxSuggestion {
    /**
     * The name of the feature.
     */
    name: string;
    /**
     * 	The preferred name of the feature, if different than {@link SearchBoxSuggestion#name}.
     */
    name_preferred: string;
    /**
     * The id to use with {@link SearchBoxCore#retrieve} to obtain full feature details.
     */
    mapbox_id: string;
    /**
     * The type of the result. For POIs, this will be `poi`.
     * For categories, this will be `category`.
     * For address-type results, the global context hierarchy is used (`country`, `region`, `postcode`, `district`, `place`, `locality`, `neighborhood`, `address`).
     * See the [Administrative unit types section](https://docs.mapbox.com/api/search/search-box/#administrative-unit-types) for details about these types.
     */
    feature_type: string;
    /**
     * The address of the result containing the address number and street.
     */
    address: string;
    /**
     * The full address of the result, which concatenates {@link SearchBoxSuggestion#address} and {@link SearchBoxSuggestion#place_formatted}.
     */
    full_address: string;
    /**
     * A formatted string of result context comprised of the place, region, country, and postcode.
     */
    place_formatted: string;
    /**
     * The context of the feature. This context has layers that follow the [Administrative unit types](https://docs.mapbox.com/api/search/search-box/#administrative-unit-types).
     */
    context: SuggestionJSONContext;
    /**
     * An IETF language tag indicating the language of the result.
     */
    language: string;
    /**
     * A string representing an associated [Maki icon](https://docs.mapbox.com/help/glossary/maki/) to use for this result.
     */
    maki: string;
    /**
     * An array including the POI categories the result falls into, if it is a POI.
     */
    poi_category: string[];
    /**
     * 	The brand name of the result, if it is a POI and is applicable.
     */
    brand: string;
    /**
     * The canonical brand ID of the result, if it is a POI and is applicable.
     */
    brand_id: string;
    /**
     * An object containing the IDs of the feature found in external databases, with the keys being the data source names and the values being the IDs.
     */
    external_ids: any;
    /**
     * An object containing additional metadata for the feature, if applicable.
     */
    metadata: any;
    /**
     * An approximate distance to the `origin` location, in meters. Only provided when `origin` and `navigation_profile` are used in the request.
     */
    distance: number;
    /**
     * The estimated time of arrival from the origin point to the feature, in minutes.
     * Only provided when `eta_type`, `origin`, and `navigation_profile` are used in the request.
     * If an address is not on the road network, an ETA will not be provided.
     */
    eta: number;
    /**
     * The distance added to an input route by including the given suggestion, in meters.
     */
    added_distance: number;
    /**
     * The estimated time added to an input route by including the given suggestion, in minutes.
     */
    added_time: number;
    _originalFeature?: SearchBoxFeatureSuggestion;
    _originalUrl?: string;
    _geometry?: GeoJSON.Point;
    _source?: string;
}
/**
 * Raw [GeoJSON](https://docs.mapbox.com/help/glossary/geojson/) feature properties
 * from the [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/).
 *
 * Reference:
 * https://docs.mapbox.com/api/search/search-box/#response-retrieve-a-suggested-feature
 *
 * @typedef SearchBoxFeatureProperties
 * @see {@link SearchBoxFeatureSuggestion}
 * @see {@link SearchBoxSuggestion}
 */
export interface SearchBoxFeatureProperties extends Omit<SearchBoxSuggestion, 'distance' | 'eta' | 'added_distance' | 'added_time'> {
    /**
     * 	The geographical coordinates of the result.
     */
    coordinates: {
        /**
         * The accuracy of the geographical coordinate of the result.
         * This is only available for address and street-type results and the options are `rooftop`, `parcel`, `proximate`, and `street`.
         */
        accuracy?: string;
        /**
         * The longitudinal coordinate of the result.
         */
        longitude: number;
        /**
         * The latitudinal coordinate of the result.
         */
        latitude: number;
        /**
         * 	An array of objects containing information about the feature's routable points.
         */
        routable_points?: {
            name: string;
            latitude: number;
            longitude: number;
        }[];
    };
    /**
     * A bounding box in the format `minimum longitude`,`minimum latitude`,`maximum longitude`,`maximum latitude`.
     */
    bbox?: [number, number, number, number];
}
/**
 * A `SearchBoxFeatureSuggestion` object represents a [GeoJSON](https://docs.mapbox.com/help/glossary/geojson/) suggestion result from the [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/).
 *
 * Feature suggestions are "part two" of the two-step interactive search experience and includes geographic coordinates. Multiple feature suggestions may be returned from a single search query,
 * for example in an airport with multiple terminals.
 *
 * As per the [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/), this will always be
 * [Point](https://geojson.org/geojson-spec.html#point).
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
 * @typedef SearchBoxFeatureSuggestion
 * @example
 * ```typescript
 * const featureSuggestion = {
 *   type: 'Feature',
 *   geometry: {
 *     type: 'Point',
 *     coordinates: [0,0]
 *   },
 *   properties: {
 *     name: 'Washington D.C.',
 *   }
 * };
 * ```
 * @see [Response: Retrieve feature](https://docs.mapbox.com/api/search/search-box/#response-retrieve-a-suggested-feature)
 */
export declare type SearchBoxFeatureSuggestion = GeoJSON.Feature<GeoJSON.Point, SearchBoxFeatureProperties> & {
    _source?: string;
};
/**
 * A `SearchBoxCategorySuggestion` object represents a [GeoJSON](https://docs.mapbox.com/help/glossary/geojson/) result
 * that is points of interest (POIs) filtered by a category at a specific location or along a route
 * from the [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/).
 *
 * As per the [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/), this will always be
 * [Point](https://geojson.org/geojson-spec.html#point).
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
 * @typedef SearchBoxCategorySuggestion
 * @example
 * ```typescript
 * const categoryFeature = {
 *   type: 'Feature',
 *   geometry: {
 *     type: 'Point',
 *     coordinates: [0,0]
 *   },
 *   properties: {
 *     name: 'Washington D.C.',
 *   }
 * };
 * ```
 * @see [Response: Category search](https://docs.mapbox.com/api/search/search-box/#response-retrieve-pois-by-category)
 */
export declare type SearchBoxCategorySuggestion = GeoJSON.Feature<GeoJSON.Point, SearchBoxFeatureProperties>;
