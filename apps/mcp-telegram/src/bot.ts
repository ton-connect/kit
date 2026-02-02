/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Telegram Bot implementation using grammY
 *
 * Features:
 * - Auto-creates wallet for new users
 * - Forwards messages to LLM for natural language processing
 * - Injects user context for each request
 */

import type { Context } from 'grammy';
import { Bot } from 'grammy';
import type { McpWalletService, SqliteStorageAdapter, SqliteSignerAdapter } from '@ton/mcp';
import { UserScopedStorage, UserScopedSigner } from '@ton/mcp';

import type { LLMService } from './services/LLMService.js';
import type { ProfileService } from './services/ProfileService.js';
import { createToolDefinitions } from './tools/definitions.js';

/**
 * Default wallet name for users
 */
const DEFAULT_WALLET_NAME = 'main';

/**
 * Bot username for mention detection in group chats
 */
let botUsername: string | undefined;

/**
 * System prompt for the LLM
 */
const SYSTEM_PROMPT = `You are a friendly TON wallet assistant in Telegram.

CRITICAL RULES:
1. ALWAYS respond in the SAME LANGUAGE the user writes to you
2. Keep responses SHORT but HELPFUL
3. Be friendly and supportive!

ADDRESSES - VERY IMPORTANT:
- NEVER type or guess addresses - ALWAYS get them from tools!
- When user asks for address: call get_wallet_address, copy the EXACT address from result
- When showing any address: copy-paste it EXACTLY from tool result, character by character
- Put addresses in \`code\` blocks: \`UQxxxxx...\`
- TON addresses start with UQ or EQ and are ~48 characters

FORMATTING:
- You CAN use Telegram markdown: *bold*, _italic_, \`code\`
- Put addresses in \`code\` blocks so users can copy them
- Keep formatting minimal

YOUR TOOLS (ALWAYS use them!):
- check_balance: Get TON balance
- get_jettons: Get token balances  
- get_wallet_address: Get wallet address - USE THIS for any address request!
- get_transaction_history: Recent transactions
- send_ton: Send TON
- send_jetton: Send tokens
- get_swap_quote / execute_swap: Swap tokens
- lookup_user: Find wallet by @username

WORKFLOW:
1. User asks something -> call appropriate tool
2. Get result from tool
3. Format response using EXACT data from tool result
4. Never invent or modify data!

JETTON MASTER ADDRESSES:
USDT: EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs, decimals: 6

NEVER DO:
- Make up or guess addresses
- Modify addresses from tool results
- Be cold or robotic
- Ask for confirmation before transfers
- Mention AI, LLM, or custody`;

/**
 * Bot configuration
 */
export interface BotConfig {
    token: string;
    walletService: McpWalletService;
    storageAdapter: SqliteStorageAdapter;
    signerAdapter: SqliteSignerAdapter;
    llmService: LLMService;
    profileService: ProfileService;
    defaultNetwork: 'mainnet' | 'testnet';
}

/**
 * Create and configure the Telegram bot
 */
export function createBot(config: BotConfig): Bot {
    const bot = new Bot(config.token);

    // Handle /start command
    bot.command('start', async (ctx: Context) => {
        await handleStart(ctx, config);
    });

    // Handle all text messages
    bot.on('message:text', async (ctx: Context) => {
        await handleMessage(ctx, config);
    });

    return bot;
}

/**
 * Initialize bot info to get username for mention detection
 * Must be called before bot.start()
 */
export async function initializeBotInfo(bot: Bot): Promise<void> {
    await bot.init();
    botUsername = bot.botInfo.username;
}

/**
 * Check if the message is forwarded (should be ignored)
 */
function isForwardedMessage(ctx: Context): boolean {
    return !!(ctx.message?.forward_origin || (ctx.message as unknown as { forward_date: boolean })?.['forward_date']);
}

/**
 * Check if the chat is a group or supergroup
 */
function isGroupChat(ctx: Context): boolean {
    return ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';
}

/**
 * Extract command text from a message that mentions the bot
 * Returns null if bot is not mentioned
 */
function extractMentionedCommand(messageText: string, username: string): string | null {
    // Match @botusername at start or anywhere in message (case insensitive)
    const mentionRegex = new RegExp(`@${username}\\b`, 'i');
    if (!mentionRegex.test(messageText)) {
        return null;
    }
    // Remove the mention and trim
    return messageText.replace(mentionRegex, '').trim();
}

/**
 * Handle /start command - ensure wallet exists and welcome user
 */
async function handleStart(ctx: Context, config: BotConfig): Promise<void> {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    const firstName = ctx.from?.first_name;

    if (!userId) {
        await ctx.reply('Sorry, I could not identify you. Please try again.');
        return;
    }

    try {
        // Check if user has a wallet
        const userSigner = new UserScopedSigner(config.signerAdapter, `tg:${userId}`);
        const wallets = await config.walletService.listWallets(userSigner);

        let walletAddress: string;

        if (wallets.length === 0) {
            // Create a wallet for the user
            const userStorage = new UserScopedStorage(config.storageAdapter, `tg:${userId}`);
            const result = await config.walletService.createWallet(
                userSigner,
                userStorage,
                DEFAULT_WALLET_NAME,
                'v5r1',
                config.defaultNetwork,
            );
            walletAddress = result.address;

            // Create/update profile
            config.profileService.createOrUpdateProfile(userId, walletAddress, username, firstName);

            await ctx.reply(
                `Welcome to TON Wallet Bot!\n\n` +
                    `I've created a new wallet for you:\n` +
                    `${walletAddress}\n\n` +
                    `You can ask me to:\n` +
                    `- Check your balance\n` +
                    `- Send TON or tokens\n` +
                    `- Show your address\n` +
                    `- Swap tokens\n\n` +
                    `Just tell me what you need!`,
            );
        } else {
            walletAddress = wallets[0].address;

            // Update profile (in case username changed)
            config.profileService.createOrUpdateProfile(userId, walletAddress, username, firstName);

            await ctx.reply(`Welcome back!\n\n` + `Your wallet:\n` + `${walletAddress}\n\n` + `How can I help you?`);
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error in /start handler:', error);
        await ctx.reply('Sorry, something went wrong. Please try again later.');
    }
}

/**
 * Handle text messages - forward to LLM for processing
 */
async function handleMessage(ctx: Context, config: BotConfig): Promise<void> {
    // Ignore forwarded messages - only process original messages from the sender
    if (isForwardedMessage(ctx)) {
        return;
    }

    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    const firstName = ctx.from?.first_name;
    let messageText = ctx.message?.text;

    if (!userId || !messageText) {
        return;
    }

    // In group chats, only respond if the bot is mentioned
    if (isGroupChat(ctx)) {
        if (!botUsername) {
            return;
        }
        const command = extractMentionedCommand(messageText, botUsername);
        if (!command) {
            // Bot not mentioned, ignore the message
            return;
        }
        // Use the extracted command (without the mention) for LLM processing
        messageText = command;
    }

    try {
        // Ensure user has a wallet
        const userSigner = new UserScopedSigner(config.signerAdapter, `tg:${userId}`);
        const userStorage = new UserScopedStorage(config.storageAdapter, `tg:${userId}`);
        const wallets = await config.walletService.listWallets(userSigner);

        if (wallets.length === 0) {
            // Auto-create wallet for new users
            const result = await config.walletService.createWallet(
                userSigner,
                userStorage,
                DEFAULT_WALLET_NAME,
                'v5r1',
                config.defaultNetwork,
            );

            // Create profile
            config.profileService.createOrUpdateProfile(userId, result.address, username, firstName);
        } else {
            // Update profile (in case username changed)
            config.profileService.createOrUpdateProfile(userId, wallets[0].address, username, firstName);
        }

        // Send typing indicator
        await ctx.replyWithChatAction('typing');

        // Create tool context for this user
        const toolContext = {
            walletService: config.walletService,
            userSigner,
            userStorage,
            profileService: config.profileService,
            walletName: DEFAULT_WALLET_NAME,
        };

        // Register tools with user context
        const tools = createToolDefinitions(toolContext);
        config.llmService.registerTools(tools);

        // Process message with LLM (include userId for conversation history)
        const response = await config.llmService.chat(String(userId), messageText, SYSTEM_PROMPT);

        // Try to send with Markdown, fallback to plain text if parsing fails
        await sendMessage(ctx, response);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error processing message:', error);
        await ctx.reply('Sorry, something went wrong. Please try again.');
    }
}

/**
 * Send message with markdown fallback
 * Tries Markdown first, falls back to plain text if parsing fails
 */
async function sendMessage(ctx: Context, text: string): Promise<void> {
    try {
        // Try with Markdown first
        await ctx.reply(text, { parse_mode: 'Markdown' });
    } catch {
        // If markdown parsing fails, send as plain text
        await ctx.reply(text);
    }
}
