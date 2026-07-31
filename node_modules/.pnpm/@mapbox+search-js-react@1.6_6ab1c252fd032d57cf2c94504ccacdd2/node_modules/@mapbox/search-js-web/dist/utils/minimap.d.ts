export declare type MapStyleMode = 'default' | 'satellite';
/**
 * Valid strings for setting `markerAnchor` on {@link MapboxAddressMinimap}
 *
 * @typedef Anchor
 */
export declare type Anchor = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right';
export declare const MAX_IMAGE_DIM = 1280;
interface MarkerTransform {
    /** X offset to correct for anchor position */
    anchorX: number;
    /** Y offset to correct for anchor position */
    anchorY: number;
    /** X offset from manual marker movement */
    globalX: number;
    /** Y offset from manual marker movement */
    globalY: number;
    correctionX: number;
    correctionY: number;
}
/**
 * Get the [X,Y] pixel offset for a given SVG marker and anchor definition
 * @param marker - An SVG element used as the marker
 * @param anchor - The anchor point of the marker to put closest to the marked coordinate
 * @returns [X,Y] pixel coordinate
 */
export declare function getAnchorOffset(marker: HTMLElement, anchor: Anchor): [number, number];
/**
 * Manages positioning of a static map image and marker relative to
 * pixel and geographical coordinates. Handles pointer events for
 * interactive/adjustable instances.
 */
export declare class MarkerController {
    #private;
    imgContainerElement: HTMLElement;
    imgElement: HTMLImageElement;
    markerElement: HTMLElement;
    keepMarkerCentered: boolean;
    zoom: number;
    /** X-offset for the marker element to account for its positioning anchor */
    anchorOffsetX: number;
    /** Y-offset for the marker element to account for its positioning anchor */
    anchorOffsetY: number;
    /** Current X pixel of the pointer on the page */
    curPointerXPos: number;
    /** Current Y pixel of the pointer on the page */
    curPointerYPos: number;
    /** X-pixels deviation of marker position from the current map/feature center point */
    markerDeltaX: number;
    /** Y-pixels deviation of marker position from the current map/feature center point */
    markerDeltaY: number;
    /**
     * Lng/lat of feature coordinate and initial image center represented as screen pixels.
     * Value is fixed for a given original coordinate.
     */
    imgCenterPx: [number, number];
    /**
     * Lng/lat of adjusted image center as screen pixels.
     * Value changes as the image is panned around in its container.
     */
    imgCenterAdjustedPx: [number, number];
    /**
     *
     * @param imageContainer - The parent element of the <img>
     * @param imageContainer - The <img> element
     * @param marker - SVG Element used as the map marker
     * @param keepMarkerCentered - If true, the marker will stay centered within the frame while the map moves behind it
     * @param zoom - The zoom level of the static map, used to calculate between screen pixel and lng/lat
     * @param anchor - The part of the marker that should be positioned closest to the coordinate
     */
    constructor(imageContainer: HTMLElement, imageElement: HTMLImageElement, marker: HTMLElement, keepMarkerCentered: boolean, zoom: number, anchor: Anchor);
    get anchor(): Anchor;
    set anchor(newAnchor: Anchor);
    get markerTransform(): MarkerTransform;
    set markerTransform(val: Partial<MarkerTransform>);
    /** True if the marker is currently in edit mode */
    get isActive(): boolean;
    /** Set to true to enable editing of the marker */
    set isActive(val: boolean);
    /** Lng/lat of the current marker location */
    get coordinate(): [number, number];
    /** Set the lng/lat corresponding to the initial marker and image center location */
    set coordinate(lngLat: [number, number]);
    /** Re-center the marker on the map at its original location */
    reCenter: () => void;
    /**
     * The x/y offset of the image from its center based on its scrolled position within its container.
     */
    get imgCenterOffset(): {
        x: number;
        y: number;
    };
    /** Update image scroll position when the Minimap has been resized */
    handleMinimapResize: () => void;
}
export {};
