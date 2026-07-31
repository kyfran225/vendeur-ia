import { ValidationFeature } from './types';
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
     * A customer-provided session token value, which groups a series of requests together for [billing purposes](https://docs.mapbox.com/api/search/search-box/#search-box-api-pricing).
     *
     * Reference:
     * https://docs.mapbox.com/api/search/search-box/#session-billing
     */
    sessionToken: SessionTokenLike;
}
/**
 * @typedef ValidationOptions
 */
export interface ValidationOptions {
    /**
     * The [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag) to be returned.
     *
     * If not specified, `en` will be used.
     */
    language: string;
    /**
     * An [ISO 3166 alpha-2 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) to be returned.
     *
     * If not specified, results will not be filtered by country.
     */
    country: string;
    /**
     * Limit results to only those contained within the supplied bounding box.
     */
    bbox: string | LngLatBoundsLike;
    /**
     * Bias the response to favor results that are closer to this location.
     *
     * When both {@link ValidationOptions#proximity} and {@link ValidationOptions#origin} are specified, `origin` is interpreted as the
     * target of a route, while `proximity` indicates the current user location.
     */
    proximity: string | LngLatLike;
}
/**
 * @typedef ValidationResponse
 */
export interface ValidationResponse {
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
    features: ValidationFeature[];
    url?: string;
}
/**
 * A `ValidationCore` object is an application's main entrypoint to the
 * Mapbox Validation API. The Mapbox Validation API is an API similar to {@link AddressAutofillCore},
 * but targeted at checking **address**.
 *
 * A [Mapbox access token](https://docs.mapbox.com/help/glossary/access-token/) is required to use `ValidationCore`, and
 * other options may be specified either in the constructor or in the {@link ValidationCore#validate} call.
 *
 * @class ValidationCore
 * @param {ValidationOptions} [options]
 * @param {string} [options.accessToken]
 */
export declare class ValidationCore {
    #private;
    static defaults: Partial<ValidationOptions>;
    /**
     * The [Mapbox access token](https://docs.mapbox.com/help/glossary/access-token/) to use for all requests.
     */
    accessToken: string;
    /**
     * Any default options ({@link ValidationOptions}) to be merged into options in the following methods:
     * - {@link ValidationOptions#validate}
     *
     * @type {ValidationOptions}
     */
    defaults: Partial<ValidationOptions>;
    constructor(options?: Partial<AccessTokenOptions & ValidationOptions>);
    /** @section {Methods} */
    /**
     * {@link ValidationCore#validate} allows you to validate an address
     * and returns the feature(s) in [GeoJSON](https://docs.mapbox.com/help/glossary/geojson/) format.
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
     * @param {String} searchText
     * @param {SessionTokenLike} optionsArg.sessionToken
     * @param {AbortSignal} [optionsArg.signal]
     */
    validate(searchText: string, optionsArg: SessionTokenOptions & Partial<FetchOptions>): Promise<ValidationResponse>;
}
export {};
