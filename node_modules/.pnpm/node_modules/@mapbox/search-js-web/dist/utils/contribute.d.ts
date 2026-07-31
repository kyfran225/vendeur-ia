/**
 * Object defining changes made to an address location feature.
 * Sent as part of payload to Contribute API.
 */
export interface ContributeChanges {
    house?: string;
    street?: string;
    address?: string;
    location?: {
        longitude: number;
        latitude: number;
    };
}
export interface FeedbackArgs {
    originalCoordinate: [number, number];
    originalAddress: string;
    changes: ContributeChanges;
    labels?: string[];
}
/**
 * Sends feedback to the Mapbox Contribute API (https://github.com/mapbox/itm-backend) given an original Address Autofill API feature and a set of user-defined changes to the address or location.
 * @param accessToken - Mapbox access token
 * @param {FeedbackArgs} feedbackArgs - Data detailing the original address and location and any changes requested
 * @param {[number, number]} feedbackArgs.originalCoordinate - Original coordinate from the Address Autofill API
 * @param {string} feedbackArgs.originalAddress - Original full_address or place_name from the Address Autofill API
 * @param {ContributeChanges} feedbackArgs.changes - Address fields or location changed by a user
 * @param {string[]} [feedbackArgs.labels] - List of labels which will be associated with the feedback
 */
export declare function sendFeedback(accessToken: string, feedbackArgs: FeedbackArgs): void;
