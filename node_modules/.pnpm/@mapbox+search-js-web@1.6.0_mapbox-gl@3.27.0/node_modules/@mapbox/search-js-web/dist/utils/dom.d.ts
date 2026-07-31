export declare function bindElements<Binding extends {
    [key: string | symbol | number]: Element;
}>(root: Element, elements: {
    [key in keyof Binding]: string;
}): Binding;
/**
 * Gets all child elements for a given node.
 */
export declare function getChildElements(node: Node): HTMLElement[];
/**
 * Creates an HTML element from a string and returns it.
 */
export declare function createElementFromString<T extends Element>(innerHTML: string): T;
/**
 * Returns a {@link CSSStyleSheet} that can be used to traverse a
 * CSS file.
 *
 * NOTE: We need to use a sub-document to avoid the styles being
 * applied to the current page.
 */
export declare function createCSSStyleSheet(text: string): CSSStyleSheet;
/**
 * Returns if the property has "display: none" set on itself.
 *
 * Reference: https://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
 */
export declare function isVisible(element: HTMLElement): boolean;
export declare type InputFormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
/**
 * Sets the value of the given input element and triggers an `input` event.
 *
 * This should also work for React, which overrides the `value` setter with
 * a custom tracker. Due to this, a naive `input.value = value` will not
 * work correctly in React.
 *
 * Reference: https://github.com/facebook/react/blob/c88fb49d37fd01024e0a254a37b7810d107bdd1d/packages/react-dom/src/client/inputValueTracking.js#L53
 * Reference: https://github.com/facebook/react/issues/11488
 */
export declare function setValue(input: InputFormElement | undefined, value: string): void;
/**
 * Pre-calculate the size of an element, handling cases where the element is not yet rendered
 * @param element - The element to measure
 * @param deep - If true, include node's descendents in calculation. Defaults to false.
 * @returns Object with height and width properties as numbers
 */
export declare function getElementSize(element: HTMLElement, deep?: boolean): {
    height: number;
    width: number;
};
/**
 * Adds a style to the current page document for the root CSS from the Mapbox search-js-web package.
 */
export declare function addDocumentStyle(css: string): void;
