export declare function transformClassSelectors(css: string, transform: (className: string) => string): string;
/**
 * Returns a version of the CSS string with each class name transformed
 * by {@link transform}.
 *
 * The main reason why this function exists is to allow for CSS class
 * encapsulation without Shadow DOM.
 */
export declare function transformCSSClassRules(text: string, transform: (className: string) => string): string;
/**
 * Manipulates {@param content} in place, with each class attribute transformed
 * by {@link transform}.
 *
 * The main reason why this function exists is to allow for CSS class
 * encapsulation without Shadow DOM.
 */
export declare function transformDOMClassAttributes(content: HTMLElement, transform: (className: string) => string): HTMLElement;
