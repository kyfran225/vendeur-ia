interface FetchImplementation {
    fetch: typeof fetch;
    AbortController: typeof AbortController;
}
/**
 * Polyfills {@link fetch} implementation used in Search JS Core.
 *
 * If a `fetch` implementation is already available, the polyfill will be
 * silently ignored.
 *
 * When running Search JS Core in a Node.js environment, fetch must be either
 * polyfilled globally or passed into this function before usage of
 * internal library functionality.
 *
 * @param opts Options for the polyfill.
 * @param {fetch} opts.fetch Required. A custom `fetch` implementation.
 * @param {AbortController} opts.AbortController Required. A custom `AbortController` implementation.
 * @param {boolean} force If `true`, the polyfill will be forced to load. Otherwise, it will only load if `fetch` is not available.
 */
export declare function polyfillFetch({ fetch, AbortController }: FetchImplementation, force?: boolean): void;
/**
 * Returns the {@link FetchImplementation} used by Search JS Core.
 */
export declare function getFetch(): FetchImplementation;
export {};
