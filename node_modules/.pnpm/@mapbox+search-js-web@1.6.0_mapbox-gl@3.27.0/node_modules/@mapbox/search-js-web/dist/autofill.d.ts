import { AddressAutofillFeatureSuggestion, AddressAutofillOptions, AddressAutofillRetrieveResponse, AddressAutofillSuggestion, AddressAutofillSuggestionResponse, Evented, AddressAutofillCore } from '@mapbox/search-js-core';
import { MapboxSearchListbox } from './components/MapboxSearchListbox';
import { MapboxHTMLEvent } from './MapboxHTMLEvent';
import { Theme } from './theme';
import { AddressConfirmOptions } from './components/MapboxAddressConfirmation';
import { PopoverOptions } from './utils/popover';
/**
 * @class AddressAutofillInstance
 */
export declare class AddressAutofillInstance {
    #private;
    get input(): HTMLInputElement;
    options: Partial<AddressAutofillOptions>;
    retrieveFeature: AddressAutofillFeatureSuggestion;
    listbox: MapboxSearchListbox<import("@mapbox/search-js-core").SearchBoxSuggestion | AddressAutofillSuggestion | import("@mapbox/search-js-core").GeocodingFeature>;
    constructor(collection: AddressAutofillCollectionType, input: HTMLInputElement, autofillRef: AddressAutofillCore);
    remove(): void;
    simulateRetrieve(feature: AddressAutofillFeatureSuggestion): void;
}
/**
 * Object defining options for Address Autofill search behavior and UI. Used to configure {@link AddressAutofillCollection}
 * @typedef AddressAutofillCollectionOptions
 */
export interface AddressAutofillCollectionOptions {
    /**
     * The [Mapbox access token](https://docs.mapbox.com/help/glossary/access-token/) to use for all requests.
     */
    accessToken?: string;
    /**
     * Options to pass to the underlying {@link AddressAutofillCore} interface.
     */
    options?: Partial<AddressAutofillOptions>;
    /**
     * The {@link Theme} to use for styling the autofill component.
     */
    theme?: Theme;
    /**
     * The {@link PopoverOptions} to define popover positioning.
     */
    popoverOptions?: Partial<PopoverOptions>;
    /**
     * If true, forms autofilled by the browser will prompt the
     * {@link confirmAddress} dialog for user confirmation.
     * An {@link AddressConfirmOptions} object can also be passed
     * to prompt {@link confirmAddress} with custom options.
     * Defaults to false.
     */
    confirmOnBrowserAutofill?: boolean | AddressConfirmOptions;
    /**
     * Enables the browser's autocomplete popup to show during the first two typed characters while Mapbox results are suppressed. Defaults to false.
     *
     * **Note:** Due to varying specifications, efforts to suppress browser autocomplete behavior may not work on all browsers.
     */
    browserAutofillEnabled?: boolean;
}
interface EventTypes<AddressAutofillSuggestionResponse, AddressAutofillRetrieveResponse> {
    /**
     * Fired when the user is typing in the input and provides a list of suggestions.
     *
     * The underlying response from {@link AddressAutofillCore} is passed as the event's detail,
     * while the responsible input is passed as the event's target.
     *
     * @event suggest
     * @instance
     * @memberof AddressAutofillCollection
     * @type {AddressAutofillSuggestionResponse}
     * @example
     * ```typescript
     * collection.addEventListener('suggest', (event) => {
     *   const suggestions = event.detail.suggestions;
     *   const inputEl = event.target;
     *   // ...
     * });
     * ```
     */
    suggest: MapboxHTMLEvent<AddressAutofillSuggestionResponse>;
    /**
     * Fired when {@link AddressAutofillCore} has errored providing a list of suggestions.
     *
     * The underlying error is passed as the event's detail,
     * while the responsible input is passed as the event's target.
     *
     * @event suggesterror
     * @instance
     * @memberof AddressAutofillCollection
     * @type {Error}
     * @example
     * ```typescript
     * collection.addEventListener('suggesterror', (event) => {
     *   const error = event.detail;
     *   const inputEl = event.target;
     *   // ...
     * });
     * ```
     */
    suggesterror: MapboxHTMLEvent<Error>;
    /**
     * Fired when the user has selected a suggestion, before the form is autofilled.
     *
     * The underlying response from {@link AddressAutofillCore} is passed as the event's detail,
     * while the responsible input is passed as the event's target.
     *
     * @event retrieve
     * @instance
     * @memberof AddressAutofillCollection
     * @type {AddressAutofillRetrieveResponse}
     * @example
     * ```typescript
     * autofill.addEventListener('retrieve', (event) => {
     *   const featureCollection = event.detail;
     *   const inputEl = event.target;
     *   // ...
     * });
     * ```
     */
    retrieve: MapboxHTMLEvent<AddressAutofillRetrieveResponse>;
}
export declare type AddressAutofillCollectionType = AddressAutofillCollection<AddressAutofillSuggestionResponse, AddressAutofillRetrieveResponse>;
/**
 * Underlying collection object class returned by the {@link autofill} function.
 *
 * @class AddressAutofillCollection
 */
export declare class AddressAutofillCollection<AddressAutofillSuggestionResponse, AddressAutofillRetrieveResponse> extends Evented<EventTypes<AddressAutofillSuggestionResponse, AddressAutofillRetrieveResponse>> {
    #private;
    instances: AddressAutofillInstance[];
    constructor({ accessToken, options, theme, popoverOptions, confirmOnBrowserAutofill, browserAutofillEnabled }: AddressAutofillCollectionOptions);
    /**
     * The [Mapbox access token](https://docs.mapbox.com/help/glossary/access-token/) to use for all requests.
     *
     * @example
     * ```typescript
     * autofill.accessToken = 'pk.my-mapbox-access-token';
     * ```
     */
    get accessToken(): string;
    set accessToken(newToken: string);
    /**
     * Options to pass to the underlying {@link AddressAutofillCore} interface.
     *
     * @example
     * ```typescript
     * autofill.options = {
     *  language: 'en',
     *  country: 'US',
     * };
     * ```
     */
    get options(): Partial<AddressAutofillOptions>;
    set options(newOptions: Partial<AddressAutofillOptions>);
    /**
     * The {@link Theme} to use for styling the autofill component.
     *
     * @example
     * ```typescript
     * autofill.theme = {
     *   variables: {
     *     colorPrimary: 'myBrandRed'
     *   }
     * };
     * ```
     */
    get theme(): Theme;
    set theme(newTheme: Theme);
    /**
     * The {@link PopoverOptions} to define popover positioning.
     *
     * @example
     * ```typescript
     * autofill.popoverOptions = {
     *   placement: 'top-start',
     *   flip: true,
     *   offset: 5
     * };
     * ```
     */
    get popoverOptions(): Partial<PopoverOptions>;
    set popoverOptions(newOptions: Partial<PopoverOptions>);
    /**
     * If true, forms autofilled by the browser will prompt the
     * {@link confirmAddress} dialog for user confirmation.
     * An {@link AddressConfirmOptions} object can also be passed
     * to prompt {@link confirmAddress} with custom options.
     * Defaults to false.
     *
     * @name confirmOnBrowserAutofill
     * @instance
     * @memberof AddressAutofillCollection
     * @type {boolean | AddressConfirmOptions}
     * @example
     * ```typescript
     * autofill.confirmOnBrowserAutofill = {
     *   minimap: true,
     *   skipConfirmModal: (feature) =>
     *     ['exact', 'high'].includes(
     *       feature.properties.match_code.confidence
     *     )
     * };
     * ```
     */
    confirmOnBrowserAutofill: boolean | AddressConfirmOptions;
    /**
     * Enables the browser's autocomplete popup to show during the first two typed characters while Mapbox results are suppressed. Defaults to false.
     *
     * **Note:** Due to varying specifications, efforts to suppress browser autocomplete behavior may not work on all browsers.
     *
     * @name browserAutofillEnabled
     * @instance
     * @memberof AddressAutofillCollection
     * @type {boolean}
     * @example
     * ```typescript
     * autofill.browserAutofillEnabled = true;
     * ```
     */
    browserAutofillEnabled?: boolean;
    /** @section {Methods} */
    /**
     * Updates autofill collection based on the current DOM state.
     * @example
     * ```typescript
     * collection.update();
     * ```
     */
    update(): void;
    /**
     * Listen for changes to the DOM, and update autofill instances when autofill-able inputs are added/removed.
     *
     * **IMPORTANT:** For performance reasons, it is recommended to carefully control
     * when this is called and to call {@link AddressAutofillCollection#unobserve} when finished.
     *
     * @example
     * ```typescript
     * collection.observe();
     * ```
     */
    observe(): void;
    /**
     * Stop listening for changes to the DOM. This only has an effect if called
     * after {@link AddressAutofillCollection#observe}.
     *
     * @example
     * ```typescript
     * collection.unobserve();
     * ```
     */
    unobserve(): void;
    /**
     * Removes all autofill instances and listeners in the document.
     *
     * @example
     * ```typescript
     * collection.remove();
     * ```
     */
    remove(): void;
}
/**
 * Entry point for Mapbox Address Autofill, for use on standard HTML input elements.
 *
 * Compared to {@link MapboxAddressAutofill}, this function automatically attaches
 * to eligible [`<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/text) elements in-place.
 *
 * You must have a [Mapbox access token](https://www.mapbox.com/help/create-api-access-token/).
 *
 * Eligible inputs must be a descendant of a [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) element, and the form
 * must have inputs with proper HTML `autocomplete` attributes. The input itself must be of autocomplete `"street-address"` or `"address-line1""`.
 *
 * If your application works with browser autofill, you may already have this functionality.
 * - [The HTML autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete)
 * - [Autofill](https://web.dev/learn/forms/autofill/)
 *
 * @param optionsArg - {@link AddressAutofillCollectionOptions} Object defining options for Address Autofill search behavior and UI.
 * @example
 * <input type="text" autocomplete="street-address" />
 * <script>
 * mapboxsearch.autofill({
 *   accessToken: 'pk.my.token',
 *   options: { country: 'us' }
 * };
 * </script>
 * @example
 * ```typescript
 * const collection = autofill({
 *   accessToken: 'pk.my.token',
 *   options
 * })
 *
 * myClientSideRouter.on('route', () => collection.update());
 * ```
 */
export declare function autofill(optionsArg: AddressAutofillCollectionOptions): AddressAutofillCollectionType;
export {};
