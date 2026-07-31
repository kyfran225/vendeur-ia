import { SearchBoxSuggestion, AddressAutofillSuggestion, GeocodingFeature } from '@mapbox/search-js-core';
import { HTMLScopedElement } from './HTMLScopedElement';
import { Theme } from '../theme';
import { PopoverOptions } from '../utils/popover';
import { MapboxHTMLEvent } from '../MapboxHTMLEvent';
import { MapboxAddressAutofill } from './MapboxAddressAutofill';
import { AddressAutofillInstance } from '../autofill';
import { InputEventDetail } from '../utils/listbox';
import { SEARCH_SERVICE } from '../utils/services';
/**
 * Event detail object for the `select` event.
 */
export declare type SelectionEventDetail<Suggestion> = {
    suggestion: Suggestion;
    selectedIndex: number;
};
declare type ListboxEventTypes<Suggestion> = {
    /**
     * Triggered on `input` events, i.e. typing  in the `<input>` element.
     */
    input: MapboxHTMLEvent<InputEventDetail>;
    /**
     * Triggered on selection events, i.e. clicking on an item in the results list
     * or hitting `Enter` with an item highlighted.
     */
    select: MapboxHTMLEvent<SelectionEventDetail<Suggestion>>;
    /**
     * Triggered on `blur` event, i.e. focus moves away from the `<input>` element.
     */
    blur: MapboxHTMLEvent<unknown>;
    /**
     * Triggered on `focus` evenet, i.e. focus moves onto the `<input>` element.
     */
    focus: MapboxHTMLEvent<unknown>;
};
export declare class MapboxSearchListbox<Suggestion extends SearchBoxSuggestion | AddressAutofillSuggestion | GeocodingFeature> extends HTMLScopedElement<ListboxEventTypes<Suggestion>> {
    #private;
    protected get template(): HTMLTemplateElement;
    protected get templateStyle(): string;
    protected get templateUserStyle(): string;
    /**
     * The current list of suggestions to be rendered in the results box.
     */
    suggestions: Suggestion[] | null;
    /**
     * The Address Autofill instance driving the listbox.
     * Can be either the custom element or function.
     */
    autofillHost?: MapboxAddressAutofill | AddressAutofillInstance;
    dataSeed: string;
    get input(): HTMLInputElement | null;
    set input(newInput: HTMLInputElement | null);
    get searchService(): SEARCH_SERVICE | null;
    set searchService(service: SEARCH_SERVICE);
    get selectedIndex(): number | undefined;
    set selectedIndex(newIndex: number);
    hideResults(): void;
    renderItem(i: number): HTMLElement;
    fillItem(el: Element, item: Suggestion, i: number, totalLength: number): void;
    get theme(): Theme;
    set theme(theme: Theme);
    get popoverOptions(): Partial<PopoverOptions>;
    set popoverOptions(newOptions: Partial<PopoverOptions>);
    renderAriaMessage: () => void;
    clearAriaMessage: () => void;
    /**
     * Handles the rendering of suggestion items returned from the input text search.
     * @param suggestions Array of suggestions or features returned from the search
     */
    handleSuggest: (suggestions: Suggestion[]) => void;
    /**
     * Handles the results box rendering when an error has occurred.
     */
    handleError: () => void;
    handleArrowUp: () => void;
    handleArrowDown: () => void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    focus(): void;
    blur(): void;
    updatePopover(): void;
}
declare global {
    interface Window {
        MapboxSearchListbox: typeof MapboxSearchListbox;
    }
}
export {};
