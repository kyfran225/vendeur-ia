import { HTMLScopedElement } from './HTMLScopedElement';
import { AddressConfirmationEventTypes } from './MapboxAddressConfirmation';
import { AutofillValueMap } from '../utils/autofill';
import { Theme } from '../theme';
/**
 * {@link MapboxAddressConfirmationNoFeature} is a custom element that
 * will display a notification when an address entered into an HTML form
 * does not return any features when queried against the Address Autofill API.
 *
 * This element is hosted by {@link MapboxAddressConfirmation} and should not be exposed to the user.
 */
export declare class MapboxAddressConfirmationNoFeature extends HTMLScopedElement<AddressConfirmationEventTypes> {
    #private;
    get template(): HTMLTemplateElement;
    get templateStyle(): string;
    get templateUserStyle(): string;
    get theme(): Theme;
    set theme(theme: Theme);
    /**
     * Update modal content with user-provided address
     * @param autofillValues - User-provided input values from address fields
     */
    update: (autofillValues: AutofillValueMap) => void;
    reject: () => void;
    connectedCallback(): void;
    disconnectedCallback(): void;
}
declare global {
    interface Window {
        MapboxAddressConfirmationNoFeature: typeof MapboxAddressConfirmationNoFeature;
    }
}
