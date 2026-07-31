import { AddressAutofillFeatureSuggestion } from '@mapbox/search-js-core';
import { AddressConfirmOptions } from '../components/MapboxAddressConfirmation';
import { AutofillValueMap } from './autofill';
/**
 * Object indicating the decision made by the user during address confirmation when using {@link confirmAddress}.
 * @typedef AddressConfirmShowResult
 */
export declare type AddressConfirmShowResult = {
    type: 'change';
    feature: AddressAutofillFeatureSuggestion;
} | {
    type: 'nochange';
} | {
    type: 'cancel';
};
/**
 * Creates a formatted, multi-line HTML element representing an address
 * @param autofillValues - A map of address `<input>` values by autocomplete attribute
 * @param baseAddress - A full address string. If provided, this will be used for the
 * first and last lines of the formatted address, and will be supplemented by any `address-line2`
 * and/or `address-line3` values provided through the `autofillValues` map.
 * @param featureName - The name of the feature used as the first line of the address.
 * @param featureDescription - The context string the feature used as the last line of the address.
 * @param isSecondary - If true, the address is a secondary address and the featureName includes secondary info.
 * @returns
 */
export declare function createAddressElement(autofillValues: AutofillValueMap, baseAddress?: string, featureName?: string, featureDescription?: string, isSecondary?: boolean): HTMLElement;
/**
 * Checks a browser autofill event against an Address Autofill input and, given
 * custom options, determines and configures if/how to show invoke {@link confirmAddress}.
 *
 * @param input - The `<input>` element wrapped or targeted by Address Autofill.
 * @param event - The custom window event detected and triggered on a browser autofill event.
 * @param confirmOnBrowserAutofill - The value of the instance property set on the autofill instance.
 * @param accessToken - A Mapbox access token.
 * @returns
 */
export declare function tryConfirmBrowserAutofill(input: HTMLInputElement, event: CustomEvent, confirmOnBrowserAutofill: boolean | AddressConfirmOptions, accessToken: string): Promise<void>;
