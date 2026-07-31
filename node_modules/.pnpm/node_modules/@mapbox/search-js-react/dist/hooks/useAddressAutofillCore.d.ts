import { AddressAutofillOptions, AddressAutofillCore } from '@mapbox/search-js-core';
/**
 * A React hook that returns a {@link AddressAutofillCore} instance.
 *
 * @param {AddressAutofillOptions} options
 * @param {string} options.accessToken Your Mapbox access token.
 * @see {@link AddressAutofillCore}
 * @example
 * ```typescript
 * import { useAddressAutofillCore } from '../src';
 * const autofill = useAddressAutofillCore({ accessToken: 'YOUR_MAPBOX_ACCESS_TOKEN' });
 * const response = await autofill.suggest('1600 pennsylvania ave nw', {
 *   sessionToken: 'test-123'
 * });
 * console.log(response);
 * // { suggestions: [...], attribution: '...' };
 * ```
 * @see {@link AddressAutofillCore}
 */
export declare function useAddressAutofillCore(options: Partial<{
    accessToken: string;
} & AddressAutofillOptions>): AddressAutofillCore;
