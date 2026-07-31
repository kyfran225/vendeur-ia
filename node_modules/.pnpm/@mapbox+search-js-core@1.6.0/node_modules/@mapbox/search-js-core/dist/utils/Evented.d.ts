/**
 * `Evented` mixes methods into other classes for event capabilities.
 *
 * If you are an end-user, you will most likely use these methods through
 * classes like {@link SearchSession}.
 *
 * For lists of events you can listen for, see API documentation for
 * specific classes.
 *
 * @class Evented
 */
export declare class Evented<T> {
    #private;
    /**
     * Adds a listener to a specified event type.
     *
     * @param type - The event type to add a listen for.
     * @param listener - The function to be called when the event is fired.
     */
    addEventListener<K extends keyof T>(type: K, listener: (arg0: T[K]) => void): void;
    /**
     * Removes a previously registered event listener.
     *
     * @param type - The event type to remove listeners for.
     * @param listener - The listener function to remove.
     */
    removeEventListener<K extends keyof T>(type: K, listener: (arg0: T[K]) => void): void;
    fire<K extends keyof T>(type: K, arg0: T[K]): void;
}
