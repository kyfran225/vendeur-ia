import { AddressAutofillSuggestion, GeocodingFeature, SearchBoxSuggestion } from '@mapbox/search-js-core';
import { SEARCH_SERVICE } from './services';
/**
 * Returns the string from suggestions that meant to be used as first stroke
 * title in search results list for that particular suggestion.
 */
export declare const getSuggestionTitle: (item: SearchBoxSuggestion | AddressAutofillSuggestion | GeocodingFeature, service: SEARCH_SERVICE) => string;
/**
 * Returns parsed/formatted description text to show in the second line of an autofill suggestion element
 */
export declare const buildSuggestionDescription: (item: SearchBoxSuggestion | AddressAutofillSuggestion | GeocodingFeature, service: SEARCH_SERVICE) => string;
/**
 * Event detail object for the 'input' event.
 */
export interface InputEventDetail {
    /**
     * The last character (or characters if pasted) that was inputted into the input field.
     */
    lastInput: string;
    /**
     * The current value of the input field.
     */
    inputText: string;
}
