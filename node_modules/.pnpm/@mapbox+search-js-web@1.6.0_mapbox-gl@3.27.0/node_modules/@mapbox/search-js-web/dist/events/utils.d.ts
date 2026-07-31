import { AddressAutofillOptions, AddressAutofillSuggestion, GeocodeFeature, GeocodeOptions, SearchBoxOptions, SearchBoxSuggestion } from '@mapbox/search-js-core';
import { SEARCH_SERVICE } from '../utils/services';
export interface EventPayloadSuggestionsData {
    suggestionIds: string[];
    suggestionNames: string[];
    suggestionTypes: string[];
    suggestionSources: string[];
}
export interface EventPayloadOptionsData {
    country?: string[];
    language?: string[];
    bbox?: number[];
    types?: string[];
    limit?: number;
    autocomplete?: boolean;
    fuzzyMatch?: boolean;
    proximity?: number[];
    routing?: boolean;
    worldview?: string;
    streets?: boolean;
    permanent?: boolean;
}
export declare type Suggestion = SearchBoxSuggestion | GeocodeFeature | AddressAutofillSuggestion;
export declare type Options = SearchBoxOptions | GeocodeOptions | AddressAutofillOptions;
/**
 * Converts API-specific options to event schema compatible options
 * @param options API options
 * @param service Search service (SearchBox, Geocoding, AddressAutofill)
 * @param responseHeaders Response headers returned by the API
 * @returns
 */
export declare const transformApiOptionsForEventSchema: (options: Options, service: SEARCH_SERVICE, responseHeaders?: Headers) => EventPayloadOptionsData;
/**
 * Converts API-specific suggestions to event schema compatible suggestions
 * @param suggestions API suggestions
 * @param service Search service (SearchBox, Geocoding, AddressAutofill)
 * @returns
 */
export declare const transformSuggestionsForEventSchema: (suggestions: Suggestion[], service: SEARCH_SERVICE) => EventPayloadSuggestionsData;
/**
 * Get the search URL path based on the search service
 * @param service Search service (SearchBox, Geocoding, AddressAutofill)
 * @param queryString The search query string
 * @returns
 */
export declare const getSearchUrlPath: (service: SEARCH_SERVICE, queryString?: string) => string;
