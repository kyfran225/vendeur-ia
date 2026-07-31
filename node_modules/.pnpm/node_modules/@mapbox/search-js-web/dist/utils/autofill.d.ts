import { AddressAutofillFeatureSuggestion, AddressAutofillSuggestion } from '@mapbox/search-js-core';
import { InputFormElement } from './dom';
/**
 * A list of WHATWG autofill tokens relevant to addresses. These will be used to
 * set the `autocomplete` attribute on the input element.
 *
 * Reference: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofilling-form-controls:-the-autocomplete-attribute
 */
declare type AutofillTokens = 'street-address' | 'address-line1' | 'address-line2' | 'address-line3' | 'address-level4' | 'address-level3' | 'address-level2' | 'address-level1' | 'country' | 'country-name' | 'postal-code';
export declare const AUTOFILL_TOKENS: Set<AutofillTokens>;
/**
 * Finds the parent form element of the given element, if any.
 *
 * @returns The parent form element, or `null` if none was found.
 */
export declare function findParentForm(el: Element): HTMLFormElement | null;
/**
 * Finds input elements that are eligible to be used for Address Autofill.
 * Eligible inputs include those with standard WHATWG autocomplete attribute values, either 'address-line1' or 'street-address'
 * @param form - If specified, searches within the given form instead of the whole document
 * @returns Array of input elements
 */
export declare function findAddressInputs(form?: HTMLFormElement): HTMLInputElement[];
declare type FormStructure = {
    input: InputFormElement;
    section: string;
    field: AutofillTokens;
}[];
/**
 * Implementation of "autocomplete" {@link FormStructure} that matches the
 * WHATWG spec and somewhat Chromium.
 *
 * `billing` and `shipping` are treated as special sections. The {@link SECTION_SHIPPING}
 * and {@link SECTION_BILLING} symbols are used to identify them.
 *
 * Any inputs without an `autocomplete` attribute are skipped.
 *
 * Reference: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
 * Reference: https://github.com/chromium/chromium/blob/18a1302acbf920bc692ec6bd986cacd41ae9c25c/components/autofill/core/browser/form_structure.cc#L1503
 */
export declare function parseFormStructure(form: HTMLFormElement): FormStructure;
export declare type AutofillInputMap = {
    [key in AutofillTokens]?: InputFormElement;
};
/**
 * Object mapping WHATWG autocomplete attribute values to corresponding address component strings.
 *
 * @typedef AutofillValueMap
 * @example
 * ```typescript
 * {
 *   "street-address"?: string;
 *   "address-line1"?: string;
 *   "address-line2"?: string;
 *   "address-line3"?: string;
 *   "address-level4"?: string;
 *   "address-level3"?: string;
 *   "address-level2"?: string;
 *   "address-level1"?: string;
 *   country?: string;
 *   "country-name"?: string;
 *   "postal-code"?: string;
 * }
 * ```
 */
export declare type AutofillValueMap = {
    [key in AutofillTokens]?: string;
};
/**
 * Reference: [chromium.md](../../../../docs/search_js_web/chromium.md)
 *
 * Implementation of autofill that closely matches Chromium, with a few noted differences:
 *
 * 1. There is no hueristic for inferring a match, so the
 *    WHATWG "autocomplete" attribute is required.
 * 2. This parser, unlike Chromium, doesn't allow more than one token type per
 *    section. Chromium **only** allows this if they are in the same order.
 */
export declare function findAddressAutofillInputs(form: HTMLFormElement, ref: HTMLInputElement): AutofillInputMap;
/**
 * Fills in the address form using HTML autocomplete attributes.
 *
 * This does a mapping from {@link SearchBoxAdministrativeUnitTypes} to corresponding WHATWG autocomplete types.
 *
 * Reference:
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete#values
 * https://docs.mapbox.com/api/search/search-box/#administrative-unit-types
 */
export declare function setFormAutofillValues(form: HTMLFormElement, ref: HTMLInputElement, suggestion: AddressAutofillSuggestion): void;
/**
 * Gets the current input values for address fields given a form and a reference input.
 *
 * @param form - HTML form that includes the autocomplete-compliant input fields
 * @param ref - An input element within the desired form address section
 * @returns A object mapping WHATWG autocomplete properties to their respective form field values
 *
 * @example
 * ```typescript
 * const form = document.querySelector(form);
 * const input = form.querySelector('input[autocomplete~="street-address"]')
 * const valueMap = getFormAutofillValues(form, input);
 * console.log(valueMap);
 * // {
 * //   "street-address": "123 Main",
 * //   "address-level2": "Boston",
 * //   "address-level1": "MA",
 * //   "postal-code": "02129"
 * // }
 * ```
 */
export declare function getFormAutofillValues(form: HTMLFormElement, ref: HTMLInputElement): AutofillValueMap;
/**
 * Converts an {@link AutofillValueMap} to a single line, suitable for
 * display in a text field.
 *
 * @param snapshot - An object mapping WHATWG autocomplete attribute values to their corresponding input field values
 * @returns A concatenated address string
 *
 * @example
 * ```typescript
 * const values = {
 *   'street-address': '123 Main St',
 *   'address-level1': 'CA',
 *   'address-level2': 'San Francisco',
 *   'address-level3': '',
 * };
 *
 * const searchText = getAutofillSearchText(values);
 * console.log(searchText); // '123 Main St, San Francisco, CA'
 * ```
 */
export declare function getAutofillSearchText(snapshot: AutofillValueMap): string;
export declare function fillFormWithFeature(feature: AddressAutofillFeatureSuggestion, input: HTMLInputElement): void;
/**
 * Gets address property values from an Autofill feature.
 *
 * @param feature - A {@link AddressAutofillFeatureSuggestion} object.
 * @returns A object mapping WHATWG autocomplete properties to their respective feature values
 */
export declare function featureToAutofillValueMap(feature: AddressAutofillFeatureSuggestion): AutofillValueMap;
/**
 * Checks if WHATWG address values from one object match those from another.
 *
 * Can be used to compare an HTML form state against the most recently retrieved Autofill feature
 * to determine if a form has been manually edited after a previous Autofill event.
 *
 * @param targetMap - An {@link AutofillValueMap} object.
 * @param referenceMap - An {@link AutofillValueMap} object.
 * @returns False if all values from the target map are equal to their corresponding value from the reference map.
 */
export declare function checkAutofillValuesChanged(targetMap: AutofillValueMap, referenceMap: AutofillValueMap): boolean;
/**
 * Takes the suggestions array and filters streets inside it to leave only unique ones
 */
export declare const distinctExactStreetResults: (suggestions: AddressAutofillSuggestion[]) => AddressAutofillSuggestion[];
export declare const toggleAutocompletion: (input: HTMLInputElement, initialAutocompleteValue: string, enableBrowserAutocomplete: boolean) => void;
export declare const handleStreetSelection: (input: HTMLInputElement, initialAutocompleteValue: string, suggestion: AddressAutofillSuggestion) => void;
export {};
