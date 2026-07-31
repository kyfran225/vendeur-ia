import { ValidationOptions, AddressAutofillFeatureSuggestion } from '@mapbox/search-js-core';
import { HTMLScopedElement } from './HTMLScopedElement';
import { AutofillValueMap } from '../utils/autofill';
import { AddressConfirmShowResult } from '../utils/confirmation';
import { MapboxHTMLEvent } from '../MapboxHTMLEvent';
import { Theme } from '../theme';
import { MapboxAddressMinimap } from './MapboxAddressMinimap';
/**
 * Styling and theming options for a {@link MapboxAddressMinimap} embedded inside a confirmation dialog.
 *
 * @typedef ConfirmationMinimapOptions
 * @example
 * ```typescript
 * const result = await confirmAddress(form, {
 *   accessToken: 'abc-123',
 *   minimap: {
 *     defaultMapStyle: ['mapbox', 'outdoors-v11'],
 *     theme: { icons: { marker: MARKER_SVG } },
 *     mapStyleMode: 'default',
 *     satelliteToggle: true
 *   }
 * });
 * ```
 */
export declare type ConfirmationMinimapOptions = Partial<Pick<MapboxAddressMinimap, 'defaultMapStyle' | 'theme' | 'mapStyleMode' | 'satelliteToggle'>>;
/**
 * Object defining options for Address Autofill API, UI, form parsing, and address comparison
 * @typedef AddressConfirmOptions
 */
export interface AddressConfirmOptions {
    /**
     * Mapbox access token used for the Address Autofill and Static Image APIs
     */
    accessToken?: string;
    /**
     * CSS variables and icons
     */
    theme?: Theme;
    /**
     * Address Autofill API configuration options
     * {@link ValidationOptions}
     */
    options?: Partial<ValidationOptions>;
    /**
     * If true, a static minimap showing the suggested address location will be displayed in the modal dialog.
     * If an object, a minimap will be displayed with the specified styling and theming configuration.
     * Defaults to false.
     */
    minimap?: boolean | ConfirmationMinimapOptions;
    /**
     * An array of section names used within form element `autocomplete` attributes to identify and group one address section from another, e.g. "section-shipping" or "section-billing".
     * These are often used when a single <form> contains multiple logical sections.
     * If left undefined, all discoverable sections will be processed.
     */
    sections?: string[];
    /**
     * A callback used to pre-confirm an address and skip the UI modal.
     * The feature argument contains all address components, as well as an {@link MatchCode} object,
     * which are used to express the confidence of an address match.
     * The callback must return a boolean, with `true` indicating that the address has been pre-confirmed,
     * and the UI modal will be skipped and will not be presented to the end-user.
     * If left undefined, this defaults to skipping showing the modal when the validated feature's match code
     * returns an "exact" match.
     */
    skipConfirmModal?: (feature: AddressAutofillFeatureSuggestion) => boolean;
    /**
     * Custom footer text appearing at the bottom of the confirmation modal dialog.
     * If `true` or left undefined, the default footer text will be used.
     * If `false`, the footer will not be shown.
     */
    footer?: boolean | string;
}
export declare type AddressConfirmationEventTypes = {
    result: MapboxHTMLEvent<AddressConfirmShowResult['type']>;
};
/**
 * {@link MapboxAddressConfirmation} is a custom element that
 * will display the "Did you mean..." message when the user
 * enters an address that doesn't match any of the results
 * returned by the Mapbox Address Autofill API.
 *
 * This element is used by {@link MapboxAddressAutofill} and the {@link autofill}
 * method, and should not be exposed to the user.
 */
export declare class MapboxAddressConfirmation extends HTMLScopedElement<AddressConfirmationEventTypes> {
    #private;
    get template(): HTMLTemplateElement;
    get templateStyle(): string;
    get templateUserStyle(): string;
    get theme(): Theme;
    set theme(theme: Theme);
    connectedCallback(): void;
    disconnectedCallback(): void;
    hide(): void;
    show(autofillValues: AutofillValueMap, optionsArg: AddressConfirmOptions, feature?: AddressAutofillFeatureSuggestion): Promise<AddressConfirmShowResult>;
    /**
     * Attempts to show an address confirmation dialog by comparing form input values with the closest match via the Address Autofill API.
     * @param autofillValues - Map of form `<input>` values for each address component
     * @param optionsArg - Options object defining API options, UI controls, and callback defining when to bypass the dialog
     * @returns A promise indicating the action taken from the confirmation dialog
     */
    tryShow(autofillValues: AutofillValueMap, optionsArg: AddressConfirmOptions): Promise<AddressConfirmShowResult>;
}
declare global {
    interface Window {
        MapboxAddressConfirmation: typeof MapboxAddressConfirmation;
    }
}
