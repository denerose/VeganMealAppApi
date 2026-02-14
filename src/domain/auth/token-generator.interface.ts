/**
 * Payload included in generated tokens (e.g. JWT).
 */
export type TokenPayload = {
  userId: string;
  tenantId: string;
  email: string;
};

/**
 * Port for generating authentication tokens (e.g. JWT).
 * Use cases depend on this interface; infrastructure provides the implementation.
 */
export interface TokenGenerator {
  generate(payload: TokenPayload): Promise<string>;
}
