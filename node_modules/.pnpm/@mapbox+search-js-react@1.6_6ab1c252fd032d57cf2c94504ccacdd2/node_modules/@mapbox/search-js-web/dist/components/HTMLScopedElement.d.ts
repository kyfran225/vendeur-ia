/**
 * Custom HTML element that uses the "Scoped DOM" approach,
 * which is not really Shadow DOM, but a way to encapsulate CSS classes
 * without Shadow DOM.
 *
 * This is a workaround for the fact that ARIA attributes are identified by
 * IDs, and cannot be shared between Shadow DOM and non-Shadow DOM (Light DOM)
 * elements due to encapsulation.
 *
 * Examples are an <input> element and its corresponding popover.
 *
 * The "Scoped DOM" approach is to encapsulate CSS classes by transforming
 * the class attribute of each element, prefixing each class with a
 * random UUID.
 *
 * Goals of the "Scoped DOM":
 *
 * - Once the [Accessibility Object Model (AOM)](https://wicg.github.io/aom/explainer.html) is finalized,
 *   replace all uses of {@link MapboxHTMLScopedElement} with {@link MapboxHTMLShadowElement}, and use
 *   AOM instead of IDREFs for ARIA attributes.
 *
 * - The Scoped DOM should be self-contained and work well enough that we don't
 *   need to constantly work around it.
 *
 * - The Scoped DOM should have extensive testing.
 */
export declare class HTMLScopedElement<Events extends {
    [key: number | string | symbol]: Event;
} = Record<string, Event>> extends HTMLElement {
    #private;
    protected get template(): HTMLTemplateElement;
    protected get templateStyle(): string;
    protected get templateUserStyle(): string;
    /**
     * `clonedCallback` should be a part of the Web Components spec, but sadly
     * it is not.
     *
     * This is detected in {@link connectedCallback} below if the seed has changed.
     */
    clonedCallback(oldSeed: string, newSeed: string): void;
    connectedCallback(): void;
    prepareTemplate(template: HTMLTemplateElement): HTMLElement;
    prepareCSS(css: string): string;
    updateTemplateUserStyle(style: string): void;
    querySelector<E extends Element = Element>(selectors: string): E;
    querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E>;
    addEventListener<K extends keyof Events>(type: K, listener: (this: HTMLFormElement, ev: Events[K]) => unknown, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof Events>(type: K, listener: (this: HTMLFormElement, ev: Events[K]) => unknown, options?: boolean | EventListenerOptions): void;
    dispatchEvent<K extends keyof Events>(event: Events[K]): boolean;
}
