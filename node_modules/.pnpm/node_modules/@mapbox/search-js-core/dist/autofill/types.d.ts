import { LngLatBoundsLike } from '../LngLatBounds';
import { MatchCode } from '../types';
/**
 * Object representing one level of hierarcy among encompassing parent features for a given {@link AddressAutofillSuggestion}.
 *
 * @typedef AddressAutofillFeatureContextComponent
 */
export interface AddressAutofillFeatureContextComponent {
    /**
     * An identifier prefixed with the component type, for example `country.123`.
     */
    id: string;
    /**
     * The unique Mapbox ID of the context feature.
     */
    mapbox_id: string;
    /**
     * A string representing the feature in the requested language, if specified.
     */
    text: string;
    /**
     * The [Wikidata](https://wikidata.org/) identifier for the returned feature.
     */
    wikidata_id?: string;
}
/**
 * An `AddressAutofillSuggestion` object represents a suggestion
 * result from the Mapbox Address Autofill API.
 *
 * Suggestion objects are "part one" of the two-step interactive autofill experience.
 * Suggestion objects do not include geographic coordinates.
 *
 * To get the coordinates of the result, use {@link AddressAutofillCore#retrieve}.
 *
 * For tracking purposes, it is useful for any follow-up requests based on this suggestion to include same
 * {@link SessionToken} as the original request.
 *
 * @typedef AddressAutofillSuggestion
 * @example
 * ```typescript
 * const autofill = new AddressAutofillCore({ accessToken: 'pk.my-mapbox-access-token' });
 *
 * const sessionToken = new SessionToken();
 * const result = await search.autofill('Washington D.C.', { sessionToken });
 * if (result.suggestions.length === 0) return;
 *
 * const suggestion = result.suggestions[0];
 * const { features } = await autofill.retrieve(suggestion, { sessionToken });
 * doSomethingWithCoordinates(features);
 * ```
 */
export interface AddressAutofillSuggestion {
    /**
     * A point accuracy metric for the returned address feature. Can be one of `rooftop`, `parcel`, `point`, `interpolated`, `intersection`, `street`.
     * @see [Point accuracy for address features](https://docs.mapbox.com/api/search/geocoding-v6/#point-accuracy-for-address-features)
     */
    accuracy?: string;
    /**
     * This is added by {@link AddressAutofillCore} and is **not** part of the
     * Mapbox Address Autofill API.
     *
     * @ignore
     */
    original_search_text: string;
    /**
     * The name of the feature.
     */
    feature_name: string;
    /**
     * The feature name, as matched by the search algorithm.
     */
    matching_name: string;
    /**
     * Additional details, such as city and state for addresses.
     */
    description: string;
    /**
     * Feature id. The `mapbox_id` uniquely identifies a feature in the Mapbox search database.
     */
    mapbox_id: string;
    /**
     * The name of the [Maki](https://labs.mapbox.com/maki-icons/) icon associated with the feature.
     */
    maki?: string;
    /**
     * The [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag) of the feature.
     */
    language: string;
    address?: string;
    /**
     * The full address of the suggestion.
     */
    full_address?: string;
    /**
     * Address line 1 from the [WHATWG Autocomplete Specification](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill)
     */
    address_line1?: string;
    /**
     * Address line 2 from the [WHATWG Autocomplete Specification](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill)
     */
    address_line2?: string;
    /**
     * Address line 3 from the [WHATWG Autocomplete Specification](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill)
     */
    address_line3?: string;
    /**
     * Address level 1 from the [WHATWG Autocomplete Specification](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill)
     */
    address_level1?: string;
    /**
     * Address level 2 from the [WHATWG Autocomplete Specification](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill)
     */
    address_level2?: string;
    /**
     * Address level 3 from the [WHATWG Autocomplete Specification](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill)
     */
    address_level3?: string;
    /**
     * Long form country name, for example: "United States"
     */
    country?: string;
    /**
     * The short form country name, for example: "us". This follows the
     * [ISO 3166 alpha-2 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) specification.
     */
    country_code?: string;
    /**
     * Postal code.
     */
    postcode?: string;
    /**
     * Address metadata fields of the feature.
     *
     * Includes the short form country name, for example: "us". This follows the
     * [ISO 3166 alpha-2 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) specification.
     */
    metadata: {
        iso_3166_1: string;
    };
    /**
     * A string representing the feature in the requested language, if specified, and its full result hierarchy.
     */
    place_name?: string;
    /**
     * An array of strings representing the geographic feature type of the feature.
     * Possible values include "address" and "secondary_address".
     */
    place_type: string[];
    /**
     * An object describing the level of confidence that the given response feature matches the address intended by the request query.
     * Includes boolean flags denoting matches for each address sub-component.
     */
    match_code: MatchCode;
    /**
     * An array of context objects representing the hierarchy of encompassing parent features for a given feature.
     */
    context: AddressAutofillFeatureContextComponent[];
    /**
     * Action block of the suggestion result.
     * contains id to execute retrieve
     */
    action: {
        id: string;
    };
    _source?: string;
}
/**
 * An `AddressAutofillFeatureSuggestion` object represents [GeoJSON](https://docs.mapbox.com/help/glossary/geojson/)
 * suggestion results from the Mapbox Address Autofill API.
 *
 * As per the Mapbox Address Autofill API, this will always be [Point](https://geojson.org/geojson-spec.html#point).
 *
 * @typedef AddressAutofillFeatureSuggestion
 * @example
 * ```typescript
 * const featureSuggestion = {
 *   type: 'Feature',
 *   geometry: {
 *     type: 'Point',
 *     coordinates: [0,0]
 *   },
 *   properties: {
 *     feature_name: 'Washington D.C.',
 *   }
 * };
 * ```
 */
export declare type AddressAutofillFeatureSuggestion = GeoJSON.Feature<GeoJSON.Point, Omit<AddressAutofillSuggestion, 'original_search_text' | 'action'>> & {
    /**
     * A bounding box for the feature. This may be significantly
     * larger than the geometry.
     */
    bbox?: LngLatBoundsLike;
};
