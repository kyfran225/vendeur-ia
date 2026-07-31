import { SEARCH_SERVICE } from '../utils/services';
import { Options, Suggestion } from './utils';
import mapboxgl from 'mapbox-gl';
interface SessionTokenOptions {
    sessionToken: string;
}
interface AccessTokenOptions {
    accessToken: string;
}
declare type EventOptions = Options & SessionTokenOptions & AccessTokenOptions;
export declare class MapboxEventManager {
    #private;
    constructor(service: SEARCH_SERVICE);
    /**
     * Send a search.start event to the mapbox events service
     * This turnstile event marks when a user starts a new search
     * @param queryString The value of the search query string
     * @param options API options
     * @param map A mapbox-gl map instance
     * @param responseHeaders API response headers
     * @returns
     */
    start: (queryString: string, options: EventOptions, map?: mapboxgl.Map, responseHeaders?: Headers) => void;
    /**
     * Send a search.keystroke event to the mapbox events service
     * This event records each time the input is changed
     * @param queryString The value of the search query string
     * @param lastInput The last character(s) typed by the user
     * @param options API options
     * @param map A mapbox-gl map instance
     * @param responseHeaders API response headers
     * @returns
     */
    input: (queryString: string, lastInput: string, options: EventOptions, map?: mapboxgl.Map, responseHeaders?: Headers) => void;
    /**
     * Send a search.select event to the mapbox events service
     * This event marks the array index of the item selected by the user out of the array of possible suggestions
     * @param queryString The value of the search query string
     * @param selectedIndex The index of the selected item in the suggestions array
     * @param suggestions The array of suggestions presented to the user
     * @param options API options
     * @param map A mapbox-gl map instance
     * @param responseHeaders API response headers
     * @returns
     */
    select: (queryString: string, selectedIndex: number, suggestions: Suggestion[], options: EventOptions, map?: mapboxgl.Map, responseHeaders?: Headers) => void;
    /**
     * End an event session and start a new one
     */
    clear: () => void;
    /**
     * Flush any remaining events from the queue before it is removed
     */
    remove: () => void;
}
export {};
