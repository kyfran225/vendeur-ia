import { LngLatBoundsLike } from '../LngLatBounds';
import { MatchCode } from '../types';
/**
 * Object representing one level of hierarcy among encompassing parent features for a given {@link ValidationFeature}.
 *
 * @typedef ValidationFeatureContextComponent
 */
export interface ValidationFeatureContextComponent {
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
 * Validation feature properties from the Mapbox Validation API.
 *
 *
 * @typedef ValidationFeatureProperties
 * @example
 * ```typescript
 * const validate = new ValidationCore({ accessToken: 'pk.my-mapbox-access-token' });
 *
 * const sessionToken = new SessionToken();
 * const result = await validate.validate('Washington D.C.', { sessionToken });
 * if (result.features.length === 0) return;
 *
 * const feature = result.features[0];
 * doSomethingWithCoordinates(features);
 * ```
 */
export interface ValidationFeatureProperties {
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
    context: ValidationFeatureContextComponent[];
}
/**
 * A `ValidationFeature` object represents [GeoJSON](https://docs.mapbox.com/help/glossary/geojson/)
 *
 * As per the Mapbox Validation API, this will always be a [Point](https://geojson.org/geojson-spec.html#point).
 *
 * @typedef ValidationFeature
 * @example
 * ```typescript
 * const validationFeature = {
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
export declare type ValidationFeature = GeoJSON.Feature<GeoJSON.Point, ValidationFeatureProperties> & {
    /**
     * A bounding box for the feature. This may be significantly
     * larger than the geometry.
     */
    bbox?: LngLatBoundsLike;
};
