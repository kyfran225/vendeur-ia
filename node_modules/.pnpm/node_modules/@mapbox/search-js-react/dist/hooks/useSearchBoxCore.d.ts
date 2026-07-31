import { SearchBoxCore, SearchBoxOptions } from '@mapbox/search-js-core';
/**
 * A React hook that returns a {@link SearchBoxCore} instance.
 *
 * @param {SearchBoxOptions} options
 * @param {string} options.accessToken Your Mapbox access token.
 * @see {@link SearchBoxCore}
 * @example
 * ```typescript
 * import { useSearchBoxCore } from '@mapbox/search-js-react';
 * const searchBoxCore = useSearchBoxCore({ accessToken: 'YOUR_MAPBOX_ACCESS_TOKEN' });
 * const response = await searchBoxCore.suggest('1600 pennsylvania ave nw', {
 *   sessionToken: 'test-123'
 * });
 * console.log(response);
 * // { suggestions: [...], attribution: '...', url: '...' };
 * ```
 */
export declare function useSearchBoxCore(options: Partial<{
    accessToken: string;
} & SearchBoxOptions>): SearchBoxCore;
