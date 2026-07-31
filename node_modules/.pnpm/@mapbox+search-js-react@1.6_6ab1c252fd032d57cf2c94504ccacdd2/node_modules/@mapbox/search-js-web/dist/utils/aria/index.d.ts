import { AddressAutofillSuggestion, GeocodingFeature, SearchBoxSuggestion } from '@mapbox/search-js-core';
/**
 * This is to make sure our custom "buttons" have appropriate
 * keyboard controls for WAI-ARIA.
 *
 * Reference: https://www.w3.org/TR/wai-aria-practices-1.1/#keyboard-interaction-3
 */
export declare function ariaButtonKeyDown(e: KeyboardEvent): void;
/**
 * Builds element that may contain different messages for VoiceOver utilities.
 * The element has necessary aria-* specific attributes and visually hidden.
 */
export declare const createAriaLiveElement: (seed: string) => HTMLDivElement;
export declare const setLiveRegionMessage: (message: string, seed: string) => void;
/**
 * Adds special parameters to form input to avoid password managers from trigger it's autocompletion on our field.
 * @param input
 */
export declare const suppressExtensionsAutocomplete: (input: HTMLInputElement) => void;
/**
 * Calculates the message for autofill component to be announced by VoiceOver utilities depending on its state.
 * @example
 * "Type in 2 or more characters for results." (When input text length is less than 2 characters)
 */
export declare const getAriaMessage: (searchValue: string, suggestions: (SearchBoxSuggestion | AddressAutofillSuggestion | GeocodingFeature)[], selectedIndex: number | undefined) => string;
