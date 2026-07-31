/**
 * An indication of how well a context component of the feature matches the query.
 *
 * @typedef MatchCodeType
 */
export declare const enum MatchCodeType {
    /**
     * The component value matches the user's input.
     */
    matched = "matched",
    /**
     * The component value doesn't match the user's input, or the user didn't submit this component type as part of the query.
     */
    unmatched = "unmatched",
    /**
     * Only relevant for the `address_number` and `secondary_address` components.
     * In the case of `address_number`, this means the address accuracy is interpolated.
     * In the case of `secondary_address`, this means the secondary address was extrapolated, i.e. the primary address is known to have secondary addresses, but the geocoder did not find a specific matching secondary address in our data.
     */
    plausible = "plausible",
    /**
     * The component is not used in the postal address string representation of the feature.
     */
    not_applicable = "not_applicable",
    /**
     * The component type wasn't submitted as part of the query, but we were able to confidently fill in the value. Only returned for the `country` component.
     */
    inferred = "inferred"
}
/**
 * An overall confidence level for how well the feature matches the query.
 *
 * @typedef MatchCodeConfidence
 */
export declare const enum MatchCodeConfidence {
    /**
     * An exact match.
     */
    exact = "exact",
    /**
     * High confidence of a match.
     */
    high = "high",
    /**
     * Medium confidence of a match.
     */
    medium = "medium",
    /**
     * Low confidence of a match.
     */
    low = "low"
}
/**
 * An object describing the level of confidence that the given response feature matches the address intended by the request query.
 *
 * @typedef MatchCode
 */
export interface MatchCode {
    /**
     * An indication of how well the `secondary_address` component of the feature matches the query.
     */
    secondary_address?: MatchCodeType;
    /**
     * An indication of how well the `address_number` component of the feature matches the query.
     */
    address_number: MatchCodeType;
    /**
     * An indication of how well the `street` component of the feature matches the query.
     */
    street: MatchCodeType;
    /**
     * An indication of how well the `postcode` component of the feature matches the query.
     */
    postcode: MatchCodeType;
    /**
     * An indication of how well the `place` component of the feature matches the query.
     */
    place: MatchCodeType;
    /**
     * An indication of how well the `region` component of the feature matches the query.
     */
    region: MatchCodeType;
    /**
     * An indication of how well the `locality` component of the feature matches the query.
     */
    locality: MatchCodeType;
    /**
     * An indication of how well the `country` component of the feature matches the query.
     */
    country: MatchCodeType;
    /**
     * An overall confidence level for how well the feature matches the query.
     */
    confidence: MatchCodeConfidence;
}
