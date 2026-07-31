import { AddressConfirmOptions } from './components/MapboxAddressConfirmation';
import { AddressConfirmShowResult } from './utils/confirmation';
/**
 * A utility that can be run prior to form submission that allows a user to correct or confirm an address.
 *
 * This parses and compares an address entered into form fields with the closest address suggestion from the Mapbox Address Autofill API.
 * Unless an exact match or a custom comparison callback evaluates to true, the user will be shown a modal dialog
 * asking if they would like to use the suggested address.
 *
 * When a suggested address is accepted, the values are automatically updated in the form fields.
 * @param form - HTML form that includes the autocomplete-compliant input fields
 * @param optionsArg - {@link AddressConfirmOptions} Object defining options for Address Autofill API, UI, form parsing, and address comparison
 * @returns A promise resolving with a result object indicating the decision made by the user
 * @example
 * ```typescript
 * form.addEventListener("submit", async (e) => {
 *   e.preventDefault();
 *   const result = await confirmAddress(form, {
 *     minimap: true,
 *     skipConfirmModal: (feature) =>
 *       ['exact', 'high'].includes(
 *         feature.properties.match_code.confidence
 *       )
 *   });
 *   if (result.type === 'nochange') submitForm();
 * });
 * ```
 */
export declare function confirmAddress(form: HTMLFormElement, optionsArg?: AddressConfirmOptions): Promise<AddressConfirmShowResult>;
