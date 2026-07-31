/**
 * Custom HTML element that makes more assumptions, such
 * as using a <template> element and using the Shadow DOM.
 */
export declare class HTMLShadowElement<Events extends {
    [key: number | string | symbol]: Event;
} = Record<string, Event>> extends HTMLElement {
    protected get template(): HTMLTemplateElement;
    protected get templateStyle(): string;
    connectedCallback(): void;
    addEventListener<K extends keyof Events>(type: K, listener: (this: HTMLFormElement, ev: Events[K]) => unknown, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof Events>(type: K, listener: (this: HTMLFormElement, ev: Events[K]) => unknown, options?: boolean | EventListenerOptions): void;
    dispatchEvent<K extends keyof Events>(event: Events[K]): boolean;
}
