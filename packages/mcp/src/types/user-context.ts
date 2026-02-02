/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * IUserContextProvider - Interface for extracting authenticated user identity
 *
 * Purpose: Identify the current user from MCP request context.
 * Returns null if user cannot be authenticated (request should be rejected).
 */

/**
 * Request context passed to the user context provider.
 * Contains headers and metadata from the MCP request.
 */
export interface RequestContext {
    /** HTTP headers (e.g., x-telegram-user-id, authorization) */
    headers?: Record<string, string>;
    /** Additional metadata from the transport */
    metadata?: Record<string, unknown>;
}

/**
 * Interface for extracting user identity from request context.
 *
 * Implementations should:
 * - Extract user ID from appropriate header or metadata
 * - Return null if user cannot be authenticated
 * - Optionally provide user metadata for auditing
 */
export interface IUserContextProvider {
    /**
     * Extract user ID from request context.
     *
     * @param context - The request context with headers and metadata
     * @returns User ID string or null if unauthenticated
     */
    getUserId(context: RequestContext): Promise<string | null>;

    /**
     * Optional: Get additional user metadata for logging/auditing.
     *
     * @param userId - The user ID
     * @returns User metadata or null if not available
     */
    getUserMetadata?(userId: string): Promise<Record<string, unknown> | null>;
}
