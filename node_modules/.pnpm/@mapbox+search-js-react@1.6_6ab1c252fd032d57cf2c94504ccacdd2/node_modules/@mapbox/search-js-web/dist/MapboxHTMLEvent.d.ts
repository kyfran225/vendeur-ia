/**
 * `MapboxHTMLEvent` is an event dispatched by the Search Box and Address Autofill
 * components.
 *
 * @example
 * ```
 * const search = new MapboxSearchBox();
 * search.addEventListener('retrieve', (event: MapboxHTMLEvent<Suggestion>) => {
 *  console.log(event.detail);
 * });
 */
export declare class MapboxHTMLEvent<T> extends CustomEvent<T> {
    constructor(type: string, detail?: T);
    /**
     * Returns a shallow copy of the event. This method is useful for
     * manually bubbling events from a connected component.
     *
     * @param newTarget - Optional event target to assign to the clone
     *
     * @example
     * `MapboxSearchBox` will call `event.clone()` on the `retrieve`
     * event from `MapboxSearchListbox`, and then dispatch the cloned event.
     */
    clone(newTarget?: EventTarget): MapboxHTMLEvent<T>;
}
