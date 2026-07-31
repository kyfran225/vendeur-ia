import { GeocodingCore, GeocodingOptions } from '@mapbox/search-js-core';
/**
 * A React hook that returns a {@link GeocodingCore} instance.
 *
 * @param {GeocodingOptions} options
 * @param {string} options.accessToken Your Mapbox access token.
 * @see {@link GeocodingCore}
 * @example
 * ```typescript
 * import { useGeocodingCore } from '@mapbox/search-js-react';
 * const geocodingCore = useGeocodingCore({ accessToken: 'YOUR_MAPBOX_ACCESS_TOKEN' });
 * const response = await geocodingCore.forward('1600 pennsylvania ave nw', {
 *   limit: 1
 * });
 * console.log(response);
 * // { type: 'FeatureCollection', features: [...], attribution: '...', url: '...' };
 * ```
 */
export declare function useGeocodingCore(options: Partial<{
    accessToken: string;
} & GeocodingOptions>): GeocodingCore;
