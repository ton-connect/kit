/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Configuration for the Telegram bot
 */

export interface Config {
    /** Telegram bot token */
    telegramBotToken: string;
    /** Wallet encryption key (32-byte hex) */
    walletEncryptionKey: string;
    /** Anthropic API key */
    anthropicApiKey: string;
    /** Anthropic model name */
    anthropicModel: string;
    /** TON network (mainnet or testnet) */
    tonNetwork: 'mainnet' | 'testnet';
    /** SQLite database path */
    databasePath: string;
    /** TonCenter API key for mainnet */
    toncenterApiKeyMainnet?: string;
    /** TonCenter API key for testnet */
    toncenterApiKeyTestnet?: string;
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): Config {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!telegramBotToken) {
        throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
    }

    const walletEncryptionKey = process.env.WALLET_ENCRYPTION_KEY;
    if (!walletEncryptionKey) {
        throw new Error('WALLET_ENCRYPTION_KEY environment variable is required (32-byte hex string)');
    }

    // Validate encryption key format
    if (!/^[0-9a-fA-F]{64}$/.test(walletEncryptionKey)) {
        throw new Error('WALLET_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    const tonNetwork = (process.env.TON_NETWORK ?? 'testnet') as 'mainnet' | 'testnet';
    if (tonNetwork !== 'mainnet' && tonNetwork !== 'testnet') {
        throw new Error('TON_NETWORK must be "mainnet" or "testnet"');
    }

    return {
        telegramBotToken,
        walletEncryptionKey,
        anthropicApiKey,
        anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-5-20250514',
        tonNetwork,
        databasePath: process.env.DATABASE_PATH ?? `./data/bot-${tonNetwork}.db`,
        toncenterApiKeyMainnet: process.env.TONCENTER_API_KEY_MAINNET,
        toncenterApiKeyTestnet: process.env.TONCENTER_API_KEY_TESTNET,
    };
}
