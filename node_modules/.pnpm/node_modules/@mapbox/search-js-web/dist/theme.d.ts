/**
 * Reference:
 * https://getbootstrap.com/docs/5.0/layout/breakpoints/
 */
export declare const MOBILE_BREAKPOINT: number;
/**
 * Currently, the only expression supported is
 * `['mobile', mobile_value, tablet_and_desktop_value]`.
 *
 * @typedef Expression
 */
declare type Expression = ['mobile', string, string];
/**
 * `ThemeVariables` are a collection of CSS variables that style Control Theme API
 * elements.
 *
 * @typedef ThemeVariables
 */
export interface ThemeVariables {
    /** @section {Sizing} */
    /**
     * Unit is the base font size and can be referenced in other variables as multiples of `1em`.
     *
     * Analogous to [`font-size`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size).
     */
    unit?: string | Expression;
    /**
     * Unit header is a derivative of `unit` and is used for modal headers.
     *
     * Analogous to [`font-size`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size).
     */
    unitHeader?: string | Expression;
    /**
     * Minimum width of elements such as modals and listboxes.
     *
     * Analogous to CSS [`<length>`](https://developer.mozilla.org/en-US/docs/Web/CSS/length).
     */
    minWidth?: string;
    /**
     * Spacing between items in an element.
     *
     * Analogous to CSS [`<length>`](https://developer.mozilla.org/en-US/docs/Web/CSS/length).
     */
    spacing?: string;
    /**
     * Padding of items in an element.
     *
     * Analogous to CSS [`<length>`](https://developer.mozilla.org/en-US/docs/Web/CSS/length).
     */
    padding?: string;
    /**
     * Padding of powered by mapbox label in footer of search listbox.
     *
     * Analogous to CSS [`<length>`](https://developer.mozilla.org/en-US/docs/Web/CSS/length).
     */
    paddingFooterLabel?: string;
    /**
     * Padding for contents of modal elements.
     *
     * Analogous to CSS [`<length>`](https://developer.mozilla.org/en-US/docs/Web/CSS/length).
     */
    paddingModal?: string;
    /** @section {Colors} */
    /**
     * Color of the primary text.
     *
     * Analogous to CSS [`color`](https://developer.mozilla.org/en-US/docs/Web/CSS/color).
     * **Default**: dark gray
     */
    colorText?: string;
    /**
     * Color of the primary accent color.
     *
     * Analogous to CSS [`color`](https://developer.mozilla.org/en-US/docs/Web/CSS/color).
     * **Default**: variant of blue
     */
    colorPrimary?: string;
    /**
     * Color of the secondary accent color.
     *
     * Analogous to CSS [`color`](https://developer.mozilla.org/en-US/docs/Web/CSS/color).
     * **Default**: blue-gray
     */
    colorSecondary?: string;
    /**
     * Background color for elements such as modals and listboxes.
     *
     * Analogous to CSS [`color`](https://developer.mozilla.org/en-US/docs/Web/CSS/color).
     * **Default**: white
     */
    colorBackground?: string;
    /**
     * Background color for items on hover.
     *
     * Analogous to CSS [`color`](https://developer.mozilla.org/en-US/docs/Web/CSS/color).
     * **Default**: light gray
     */
    colorBackgroundHover?: string;
    /**
     * Background color for items on press.
     *
     * Analogous to CSS [`color`](https://developer.mozilla.org/en-US/docs/Web/CSS/color).
     * **Default**: dark gray
     */
    colorBackgroundActive?: string;
    /**
     * Backdrop color of body content behind modals.
     *
     * Analogous to CSS [`color`](https://developer.mozilla.org/en-US/docs/Web/CSS/color).
     * **Default**: black with alpha value
     */
    colorBackdrop?: string;
    /** @section {Borders and box shadows} */
    /**
     * Border color of elements such as modals and listboxes.
     *
     * Analogous to CSS [`border`](https://developer.mozilla.org/en-US/docs/Web/CSS/border).
     */
    border?: string;
    /**
     * Border radius of elements such as modals and listboxes.
     *
     * Analogous to CSS [`border-radius`](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius).
     */
    borderRadius?: string;
    /**
     * Box shadow of elements such as modals and listboxes.
     *
     * Analogous to CSS [`box-shadow`](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow).
     */
    boxShadow?: string;
    /** @section {Typography} */
    /**
     * Line height.
     *
     * Analogous to CSS [`line-height`](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height).
     * **Default**: 1.2
     */
    lineHeight?: string;
    /**
     * Font family.
     *
     * Analogous to CSS [`font-family`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family).
     * **Default**: Sans-serif [system font stack](https://systemfontstack.com/)
     */
    fontFamily?: string;
    /**
     * Font weight for body text.
     *
     * Analogous to CSS [`font-weight`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight).
     * **Default**: normal
     */
    fontWeight?: string;
    /**
     * Font weight for subheadings.
     *
     * Analogous to CSS [`font-weight`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight).
     * **Default**: 600
     */
    fontWeightSemibold?: string;
    /**
     * Font weight for headings and item titles.
     *
     * Analogous to CSS [`font-weight`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight).
     * **Default**: bold
     */
    fontWeightBold?: string;
    /** @section {Transitions} */
    /**
     * The duration to use for listbox animations.
     *
     * Analogous to CSS [`<time>`](https://developer.mozilla.org/en-US/docs/Web/CSS/time).
     * **Default**: `150ms`
     */
    duration?: string;
    /**
     * The timing function to use for listbox animations.
     *
     * Analogous to CSS [`<easing-function>`](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function).
     * **Default**: `ease-out`
     */
    curve?: string;
}
/**
 * `ThemeIcons` are [SVG icons](https://developer.mozilla.org/en-US/docs/Web/SVG)
 * that are used in Control Theme API elements.
 *
 * Roughly, icon names and their defaults are the same as
 * [Mapbox's Assembly](https://labs.mapbox.com/assembly/icons/).
 *
 * Values must be valid SVG plain-text. Unless otherwise noted,
 * icons should be 18px in size and have appropriate dimensions set.
 *
 * Icons can also be filled with 'currentColor'.
 *
 * @typedef ThemeIcons
 * @example
 * ```typescript
 * const icons = {
 *   close: `
 * <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
 * <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
 *   <path fill-rule="evenodd" clip-rule="evenodd" d="M3.79289 3.79289C4.18342 3.40237 4.81658 3.40237 5.20711 3.79289L9 7.58579L12.7929 3.79289C13.1834 3.40237 13.8166 3.40237 14.2071 3.79289C14.5976 4.18342 14.5976 4.81658 14.2071 5.20711L10.4142 9L14.2071 12.7929C14.5976 13.1834 14.5976 13.8166 14.2071 14.2071C13.8166 14.5976 13.1834 14.5976 12.7929 14.2071L9 10.4142L5.20711 14.2071C4.81658 14.5976 4.18342 14.5976 3.79289 14.2071C3.40237 13.8166 3.40237 13.1834 3.79289 12.7929L7.58579 9L3.79289 5.20711C3.40237 4.81658 3.40237 4.18342 3.79289 3.79289Z" fill="currentColor"/>
 * </svg>
 * `
 * }
 * ```
 */
export interface ThemeIcons {
    /**
     * Close icon.
     */
    close?: string;
    /**
     * Question mark icon.
     */
    question?: string;
    /**
     * Icon for map markers. Can be any size.
     */
    marker?: string;
    /**
     * Icon for streets results in search list box.
     */
    street?: string;
    /**
     * Icon for address results in search list box.
     */
    addressMarker?: string;
    /**
     * Icon for Search Box input.
     */
    search?: string;
}
/**
 * `ThemeImages` are raster images that are used in Control Theme API elements.
 *
 * There are currently only two images, "toggle default" and "toggle satellite,"
 * which specify images for a Map/Satellite toggle button.
 *
 * Values must be valid URLs accessible by the expected browser environment. [Data URLs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs)
 * and [Blob URLs](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL) are also supported.
 *
 * @typedef ThemeImages
 */
export interface ThemeImages {
    /**
     * Image for the "Map" of the Map/Satellite toggle button.
     */
    styleToggleDefault?: string;
    /**
     * Image for the "Satellite" of the Map/Satellite toggle button.
     */
    styleToggleSatellite?: string;
}
/**
 * The Control Theme API is a way to apply your own design system to
 * Mapbox Search JS Web elements.
 *
 * Control themes use a combination of CSS variables, custom scoped CSS, and
 * SVG icons.
 *
 * @typedef Theme
 * @example
 * ```typescript
 * const theme = {
 *   variables: {
 *     fontFamily: 'Avenir, sans-serif',
 *     unit: '14px',
 *     padding: '0.5em',
 *     borderRadius: '0',
 *     boxShadow: '0 0 0 1px silver',
 *   }
 * };
 *
 * autofill({ theme });
 * ```
 */
export interface Theme {
    /**
     * CSS variables to be applied to the control.
     */
    variables?: ThemeVariables;
    /**
     * SVG icon overrides to be applied to the control.
     */
    icons?: ThemeIcons;
    /**
     * Raster image URLs to be applied to the control.
     */
    images?: ThemeImages;
    /**
     * Optional CSS text to be inserted into Scoped CSS elements. As such, any
     * CSS will not interact with the rest of the page.
     *
     * TODO: Class names are element-specific and have yet to be standardized. Breaking
     * changes are likely and will be flagged in CHANGELOG.md.
     */
    cssText?: string;
}
declare type CSSText = string;
/**
 * Applies {@link Theme} to the given HTML element as CSS variables
 * in the style attribute.
 */
export declare function getThemeCSS(rootSelector: string, theme?: Theme): CSSText;
export declare function getIcon<I extends keyof Theme['icons']>(iconName: I, theme?: Theme): string | undefined;
export declare function getImage<I extends keyof Theme['images']>(imageName: I, theme?: Theme): string | undefined;
export {};
