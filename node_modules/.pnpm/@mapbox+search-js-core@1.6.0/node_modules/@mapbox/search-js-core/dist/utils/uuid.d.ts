/**
 * Validates the UUID v4.
 * @param id - UUID value.
 */
export declare function validateUUID(id: string): boolean;
/**
 * Generates a RFC4122 v4 UUID (pseudo-randomly-based)
 *
 * IMPORTANT: THIS IS NOT CRYPTO-GRAPHICALLY SECURE!
 *
 * Since we're using this to generate a random UUID, essentially as an SKU,
 * we don't need to worry about the randomness of the values as much.
 */
export declare function generateUUID(): string;
