import { LngLatBoundsLike } from '../LngLatBounds';
import { MatchCode } from '../types';
/**
 * Geographic feature data types for the [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding-v6/).
 *
 * @typedef FeatureTypes
 * @see https://docs.mapbox.com/api/search/geocoding-v6/#geographic-feature-types
 */
export declare type FeatureTypes = 'country' | 'region' | 'postcode' | 'district' | 'place' | 'locality' | 'neighborhood' | 'street' | 'block' | 'address' | 'secondary_address';
/**
 * Routable point data for an address feature.
 *
 * @typedef RoutablePoint
 */
export interface RoutablePoint {
    /**
     * The name of the routable point.
     */
    name: string;
    /**
     * The longitude of the routable point.
     */
    longitude: number;
    /**
     * The latitude of the routable point.
     */
    latitude: number;
}
/**
 * Coordinate and accuracy data for a geographic feature.
 *
 * @typedef Coordinates
 */
export interface Coordinates {
    /**
     * The longitude of the feature.
     */
    longitude: number;
    /**
     * The latitude of the feature.
     */
    latitude: number;
    /**
     * A coordinate accuracy indicator for address features. Can be one of `rooftop`, `parcel`, `point`, `interpolated`, `approximate`.
     * @see [Point accuracy for address features](https://docs.mapbox.com/api/search/geocoding-v6/#point-accuracy-for-address-features)
     */
    accuracy?: string;
    /**
     * Routable point data for an address feature.
     */
    routable_points?: RoutablePoint[];
}
/**
 * Raw [GeoJSON](https://docs.mapbox.com/help/glossary/geojson/) feature properties
 * from the [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding-v6/).
 *
 * Reference:
 * https://docs.mapbox.com/api/search/geocoding-v6/#geocoding-response-object
 *
 * @typedef GeocodingFeatureProperties
 */
export interface GeocodingFeatureProperties {
    /**
     * Feature id. The `mapbox_id` uniquely identifies a feature in the Mapbox search database. Mapbox ID’s are accepted in requests to the Geocoding API as a forward search, and will return the feature corresponding to that id.
     */
    mapbox_id: string;
    /**
     * A string describing the geographic type of the feature. See {@link FeatureTypes} for supported options.
     */
    feature_type: string;
    /**
     * Formatted string of the most granular geographical component of the feature. For example, for an address this will be the address number and street.
     * For features known by multiple aliases, this field will represent the alias, if one is available, matching the queried text.
     */
    name: string;
    /**
     * Similar to `name`, except this will always be the canonical or otherwise more common alias for the feature name. For example, searching for "America" will return "America" as the `name`, and "United States" as name_preferred.
     */
    name_preferred: string;
    /**
     * Formatted string of the feature context (e.g. `place` + `region` + `country` + `postcode` + `counry`). The part of the full feature name which comes after `name`.
     */
    place_formatted: string;
    /**
     * The full feature text string, combining `name_preferred` and `place_formatted`.
     */
    full_address: string;
    /**
     * Coordinate and accuracy data for a geographic feature.
     */
    coordinates: Coordinates;
    /**
     * Object representing the hierarchy of encompassing parent features.
     */
    context: Partial<GeocodingFeatureContext>;
    /**
     * A bounding box for the feature. This may be significantly
     * larger than the geometry.
     * This property is only provided with features of type `country`, `region`, `postcode`, `district`, `place`, `locality`, or `neighborhood`.
     */
    bbox?: LngLatBoundsLike;
    /**
     * Match codes for each context component of an address, plus an overall match confidence. Provides an indication of how well each part of the address matched the query.
     */
    match_code?: MatchCode;
}
/**
 * Object representing the hierarchy of encompassing parent features for a given {@link GeocodingFeature}.
 *
 * @typedef GeocodingFeatureContext
 */
export declare type GeocodingFeatureContext = {
    /**
     * Address context component. Includes separate `address_number` and `street_name` properties.
     */
    address: GeocodingFeatureContextComponent;
    /**
     * Street context component.
     */
    street: GeocodingFeatureContextComponent;
    /**
     * Neighborhood context component.
     */
    neighborhood: GeocodingFeatureContextComponent;
    /**
     * Postcode context component.
     */
    postcode: GeocodingFeatureContextComponent;
    /**
     * Locality context component.
     */
    locality: GeocodingFeatureContextComponent;
    /**
     * Place context component.
     */
    place: GeocodingFeatureContextComponent;
    /**
     * District context component.
     */
    district: GeocodingFeatureContextComponent;
    /**
     * Region context component. If available, may include additional `region_code` and `region_code_full` properties.
     */
    region: GeocodingFeatureContextComponent;
    /**
     * Country context component. Includes additional `country_code` and `country_code_alpha_3` properties.
     * @see https://en.wikipedia.org/wiki/ISO_3166-1
     */
    country: GeocodingFeatureContextComponent;
};
/**
 * Object representing one level of hierarcy among encompassing parent features for a given {@link GeocodingFeature}.
 *
 * @typedef GeocodingFeatureContextComponent
 */
export interface GeocodingFeatureContextComponent {
    /**
     * The unique Mapbox ID of the context feature.
     */
    mapbox_id: string;
    /**
     * A string representing the feature in the requested language, if specified.
     */
    name: string;
    /**
     * The [Wikidata](https://wikidata.org/) identifier for the returned feature.
     */
    wikidata_id?: string;
}
/**
 * A `GeocodingFeature` object represents a [GeoJSON](https://docs.mapbox.com/help/glossary/geojson/) feature result from the [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding-v6/).
 *
 * **Legal terms:**
 *
 * Due to legal terms from our data sources, results from the [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding-v6/) should use the `permanent=true` flag
 * if the results are to be cached/stored in a customer database. Otherwise, results should be used ephemerally and not persisted.
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
 * @typedef GeocodingFeature
 * @see [Geocoding response object](https://docs.mapbox.com/api/search/geocoding-v6/#geocoding-response-object)
 */
export declare type GeocodingFeature = GeoJSON.Feature<GeoJSON.Point, GeocodingFeatureProperties> & {
    /**
     * Feature id. This property is named "id" to conform to the GeoJSON specification, but is the same id referred to as mapbox_id within the properties object.
     */
    id: string;
    _source?: string;
};
