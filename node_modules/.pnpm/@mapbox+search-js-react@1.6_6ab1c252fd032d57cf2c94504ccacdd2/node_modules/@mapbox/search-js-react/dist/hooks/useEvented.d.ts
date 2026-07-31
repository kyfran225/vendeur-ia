import { Evented } from '@mapbox/search-js-core';
/**
 * A React hook to register an event listener on a Search JS Core Evented object.
 *
 * {@link Evented} is a base class that is inherited by {@link SearchSession}.
 */
export declare function useEvented<T, K extends keyof T>(evented: Evented<T> | null, eventName: K, cb: (object: T[K]) => unknown): void;
