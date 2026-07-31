/**
 * Detects browser autofill events and emits custom events
 * Reference: https://github.com/matteobad/detect-autofill
 */
export declare const ATTR_NAME = "browser-autofilled";
/**
 * Manage an input element when its value is autocompleted
 * by the browser
 *
 * @param {HtmlInputElement} element
 */
export declare function browserAutofill(element: HTMLInputElement): void;
/**
 * Manage an input element when its autocompleted value is
 * removed by the browser
 *
 * @param {HtmlInputElement} element
 */
export declare function cancelBrowserAutofill(element: HTMLInputElement): void;
/**
 * Handler for -webkit based browser that listen for a custom
 * animation create using the :pseudo-selector in the stylesheet.
 * Works with Chrome, Safari
 *
 * @param {AnimationEvent} event
 */
export declare function onAnimationStart(event: AnimationEvent): void;
/**
 * Handler for non-webkit based browser that listen for input
 * event to trigger the autocomplete-cancel process.
 * Works with Firefox, Edge, IE11
 *
 * @param {InputEvent} event
 */
export declare function onInput(event: InputEvent): void;
/**
 * Enables detection of browser autofill events
 */
export declare function initDetectBrowserAutofill(): void;
