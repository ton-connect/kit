/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * TelegramUserContextProvider - Extract user ID from Telegram bot context
 *
 * This provider extracts the Telegram user ID from:
 * 1. x-telegram-user-id header
 * 2. metadata.telegramUserId field
 *
 * For use with Telegram bot integrations.
 */

import type { IUserContextProvider, RequestContext } from '../types/user-context.js';

/**
 * Configuration for TelegramUserContextProvider
 */
export interface TelegramUserContextConfig {
    /**
     * Header name to extract user ID from
     * @default 'x-telegram-user-id'
     */
    headerName?: string;

    /**
     * Metadata key to extract user ID from
     * @default 'telegramUserId'
     */
    metadataKey?: string;

    /**
     * Optional prefix to add to user IDs
     * @default 'tg:'
     */
    userIdPrefix?: string;
}

/**
 * User context provider for Telegram bot integrations.
 * Extracts user ID from headers or metadata.
 */
export class TelegramUserContextProvider implements IUserContextProvider {
    private readonly headerName: string;
    private readonly metadataKey: string;
    private readonly userIdPrefix: string;

    constructor(config?: TelegramUserContextConfig) {
        this.headerName = config?.headerName ?? 'x-telegram-user-id';
        this.metadataKey = config?.metadataKey ?? 'telegramUserId';
        this.userIdPrefix = config?.userIdPrefix ?? 'tg:';
    }

    /**
     * Extract user ID from request context
     */
    async getUserId(context: RequestContext): Promise<string | null> {
        // Try header first
        if (context.headers) {
            const headerValue = context.headers[this.headerName];
            if (headerValue && this.isValidUserId(headerValue)) {
                return `${this.userIdPrefix}${headerValue}`;
            }
        }

        // Try metadata
        if (context.metadata) {
            const metadataValue = context.metadata[this.metadataKey];
            if (metadataValue !== undefined && metadataValue !== null) {
                const userId = String(metadataValue);
                if (this.isValidUserId(userId)) {
                    return `${this.userIdPrefix}${userId}`;
                }
            }
        }

        return null;
    }

    /**
     * Get user metadata (optional)
     */
    async getUserMetadata(userId: string): Promise<Record<string, unknown> | null> {
        // Extract Telegram user ID from prefixed ID
        const telegramUserId = userId.startsWith(this.userIdPrefix) ? userId.slice(this.userIdPrefix.length) : userId;

        return {
            telegramUserId,
            provider: 'telegram',
        };
    }

    /**
     * Validate user ID format
     */
    private isValidUserId(userId: string): boolean {
        // Telegram user IDs are numeric
        return /^\d+$/.test(userId);
    }
}

/**
 * Simple user context provider that always returns a fixed user ID.
 * Useful for single-user CLI applications or testing.
 */
export class StaticUserContextProvider implements IUserContextProvider {
    private readonly userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    async getUserId(): Promise<string> {
        return this.userId;
    }

    async getUserMetadata(): Promise<Record<string, unknown> | null> {
        return {
            provider: 'static',
            userId: this.userId,
        };
    }
}
