/**
 * Version of the classic `debounce` function that accepts a `signalFn`
 * argument, which can return an {@link AbortSignal}.
 */
export declare function debounce<F extends (...args: unknown[]) => unknown>(func: F, wait: number, signalFn?: () => AbortSignal): F;
