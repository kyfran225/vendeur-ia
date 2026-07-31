import { AddressAutofillFeatureSuggestion } from '@mapbox/search-js-core';
import { HTMLScopedElement } from './HTMLScopedElement';
import { AddressConfirmationEventTypes, ConfirmationMinimapOptions } from './MapboxAddressConfirmation';
import { AutofillValueMap } from '../utils/autofill';
import { Theme } from '../theme';
/**
 * {@link MapboxAddressConfirmationNoFeature} is a custom element that
 * will display a notification showing the closest suggested address to what a user has provided in the form.
 * Optionally, it can display a {@link MapboxAddressMinimap} for the suggesested address feature.
 *
 * This element is hosted by {@link MapboxAddressConfirmation} and should not be exposed to the user.
 */
export declare class MapboxAddressConfirmationFeature extends HTMLScopedElement<AddressConfirmationEventTypes> {
    #private;
    get template(): HTMLTemplateElement;
    get templateStyle(): string;
    get templateUserStyle(): string;
    get theme(): Theme;
    set theme(theme: Theme);
    set footer(val: boolean | string);
    minimap: boolean | ConfirmationMinimapOptions;
    accessToken: string;
    /**
     * Update modal content with a given address suggestion
     * @param feature - Suggested feature
     * @param autofillValues - User-provided input values from address fields; used to backfill address-line2, address-line3
     */
    update: (feature: AddressAutofillFeatureSuggestion, autofillValues: AutofillValueMap) => void;
    approve: () => void;
    reject: () => void;
    connectedCallback(): void;
    disconnectedCallback(): void;
}
declare global {
    interface Window {
        MapboxAddressConfirmationFeature: typeof MapboxAddressConfirmationFeature;
    }
}
