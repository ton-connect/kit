/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * TON MCP Telegram Bot - Entry point
 *
 * A Telegram bot that uses natural language processing via Anthropic Claude
 * to interact with TON wallets through the @ton/mcp package.
 */

import { SqliteStorageAdapter, SqliteSignerAdapter } from './adapters/index.js';
import { loadConfig } from './config.js';
import { initializeDatabase } from './db/schema.js';
import { ProfileService } from './services/ProfileService.js';
import { LLMService } from './services/LLMService.js';
import { createBot, initializeBotInfo } from './bot.js';
import { UserServiceFactory } from './core/UserServiceFactory.js';

// Log helper
function log(message: string): void {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(`[${timestamp}] ${message}`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
    log('Starting TON MCP Telegram Bot...');

    // Load configuration
    const config = loadConfig();
    log(`Network: ${config.tonNetwork}`);
    log(`Anthropic model: ${config.anthropicModel}`);
    log(`Database: ${config.databasePath}`);

    // Initialize database
    log('Initializing database...');
    const db = initializeDatabase(config.databasePath);
    log('Database initialized');

    // Create adapters
    const storageAdapter = new SqliteStorageAdapter({
        db,
        tableName: 'storage',
    });

    const signerAdapter = new SqliteSignerAdapter({
        db,
        encryptionKey: config.walletEncryptionKey,
        tableName: 'wallets',
    });

    // Create user service factory
    const userServiceFactory = new UserServiceFactory({
        signer: signerAdapter,
        storage: storageAdapter,
        defaultNetwork: config.tonNetwork,
        networks: {
            mainnet: config.toncenterApiKeyMainnet ? { apiKey: config.toncenterApiKeyMainnet } : undefined,
            testnet: config.toncenterApiKeyTestnet ? { apiKey: config.toncenterApiKeyTestnet } : undefined,
        },
    });
    log('User service factory initialized');

    // Create profile service
    const profileService = new ProfileService(db);
    log('Profile service initialized');

    // Create LLM service
    const llmService = new LLMService({
        apiKey: config.anthropicApiKey,
        model: config.anthropicModel,
    });
    log('LLM service initialized');

    // Create Telegram bot
    const bot = createBot({
        token: config.telegramBotToken,
        userServiceFactory,
        llmService,
        profileService,
        defaultNetwork: config.tonNetwork,
    });
    log('Telegram bot created');

    // Initialize bot info for group chat mention detection
    await initializeBotInfo(bot);
    log(`Bot username: @${bot.botInfo.username}`);

    // Handle graceful shutdown
    const shutdown = async (): Promise<void> => {
        log('Shutting down...');
        bot.stop();
        await userServiceFactory.closeAll();
        await signerAdapter.close();
        db.close();
        log('Shutdown complete');
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Start the bot
    log('Starting bot...');
    await bot.start({
        onStart: (botInfo) => {
            log(`Bot started as @${botInfo.username}`);
            log('Ready to accept messages!');
        },
    });
}

// Run
main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Fatal error:', error);
    process.exit(1);
});
