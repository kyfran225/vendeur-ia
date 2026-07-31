import { AddressAutofillOptions, AddressAutofillRetrieveResponse, AddressAutofillSuggestion, AddressAutofillSuggestionResponse, AddressAutofillCore, SearchBoxCore, SearchBoxOptions, SearchBoxRetrieveResponse, SearchBoxSuggestion, SearchBoxSuggestionResponse, GeocodingOptions, GeocodingFeature, GeocodingResponse, GeocodingCore, SearchSession } from '@mapbox/search-js-core';
export declare type SearchSessionType = SearchSession<SearchBoxOptions, SearchBoxSuggestion, SearchBoxSuggestionResponse, SearchBoxRetrieveResponse>;
export declare type AddressAutofillSearchSessionType = SearchSession<AddressAutofillOptions, AddressAutofillSuggestion, AddressAutofillSuggestionResponse, AddressAutofillRetrieveResponse>;
export declare type GeocodingSearchSessionType = SearchSession<GeocodingOptions, GeocodingFeature, GeocodingResponse, GeocodingFeature>;
declare function useSearchSession(search: SearchBoxCore): SearchSessionType;
declare function useSearchSession(geocoding: GeocodingCore): GeocodingSearchSessionType;
declare function useSearchSession(autofill: AddressAutofillCore): AddressAutofillSearchSessionType;
export { useSearchSession };
