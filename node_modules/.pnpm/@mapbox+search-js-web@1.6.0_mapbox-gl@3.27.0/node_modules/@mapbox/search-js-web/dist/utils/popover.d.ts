/**
 * Options controlling the display of the Popover used in {@link AddressAutofill}, {@link MapboxSearchBox}, and {@link MapboxGeocoder}.
 * @typedef PopoverOptions
 */
export interface PopoverOptions {
    /**
     * Positions the popover above or below the reference element. Defaults to 'bottom-start'.
     */
    placement: 'top-start' | 'bottom-start';
    /**
     * If true, the popover will flip to the opposite side of the reference element to try to keep it in view when scrolling out of frame. Defaults to false.
     */
    flip: boolean;
    /**
     * The distance gap between the popover and the reference element. Defaults to 5px.
     */
    offset: number;
}
/**
 * Wrapper around floating-ui controls to manage popover positioning and lifecycle.
 */
export declare class Popover {
    #private;
    /**
     * The element around which the popover is positioned, e.g. the `<input>` search box
     */
    referenceEl: HTMLElement;
    /**
     * The floating popover element, e.g. the results box
     */
    floatingEl: HTMLElement;
    /**
     * Cleans up the popover instance and any side effects
     */
    destroy: () => void;
    constructor(referenceEl: HTMLElement, floatingEl: HTMLElement, options?: Partial<PopoverOptions>);
    /**
     * Positioning options for the popover element.
     */
    get options(): PopoverOptions;
    set options(newOptions: Partial<PopoverOptions>);
    /**
     * Recomputes the popover position one time
     */
    update: () => Promise<void>;
}
