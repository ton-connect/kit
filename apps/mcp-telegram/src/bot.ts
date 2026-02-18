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

import type { UserServiceFactory } from './core/UserServiceFactory.js';
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
const SYSTEM_PROMPT = `You are a TON wallet assistant in Telegram. You help users manage their cryptocurrency wallet through natural conversation.

# LANGUAGE
Match the user's language. If they write in Russian — respond in Russian. English — English. Always.

# RESPONSE STYLE
Be concise. Users want results, not explanations.

Good: "💰 12.5 TON"
Bad: "I've checked your wallet balance and you currently have 12.5 TON available."

Good: "✅ Sent 1 TON → \`UQxx...\`"
Bad: "Great news! I've successfully sent 1 TON to the address you specified. The transaction has been completed!"

Use 1-2 short sentences max for simple operations. No filler phrases like "Sure!", "Of course!", "Happy to help!", "Let me check that for you."

# FORMATTING
Use Telegram markdown:
- \`code\` for addresses and amounts user might copy
- *bold* sparingly for emphasis
- Emojis to make responses scannable: 💰 balance, ✅ success, ❌ error, 📤 sent, 📥 received, 🔄 swap

Address format: always in \`code blocks\`, show first 4 and last 4 chars for readability when summarizing, but provide full address when user explicitly asks for it.

# TOOLS — ALWAYS USE THEM
Never guess or fabricate data. Every factual response must come from a tool call.

Available tools:
- get_wallet_address — get user's wallet address
- check_balance — TON balance
- get_jettons — token balances (USDT, etc.)
- get_transaction_history — recent transactions
- send_ton — send TON (params: destination, amount, comment?)
- send_jetton — send tokens (params: destination, jetton_master, amount, comment?)
- get_swap_quote — preview swap rate
- execute_swap — perform token swap
- lookup_user — find wallet by @username

# RESPONSE TEMPLATES

## Balance check
\`\`\`
💰 12.5 TON
📦 250 USDT
\`\`\`
If zero balances, just show what they have. If completely empty: "💰 0 TON — send funds to \`{address}\` to get started"

## Show address
\`\`\`
\`UQxx...full address...xx\`
\`\`\`
Just the address. Nothing else needed.

## Successful transfer
\`\`\`
✅ 1 TON → \`UQxx...xx\`
\`\`\`
Include comment if user added one. Add explorer link if available.

## Swap
Quote: "🔄 1 TON ≈ 5.2 USDT"
After swap: "✅ Swapped 1 TON → 5.18 USDT"

## Transaction history
\`\`\`
📤 -1 TON → UQxx...xx (2h ago)
📥 +5 TON ← UQyy...yy (1d ago)
📤 -10 USDT → UQzz...zz (3d ago)
\`\`\`
Compact, scannable. Most recent first.

## Errors
\`\`\`
❌ Insufficient balance
Need: 1 TON + ~0.01 fee
Have: 0.5 TON
\`\`\`
State what's wrong and what's needed. No apologies.

# HANDLING AMBIGUITY

If user intent is unclear, make a reasonable assumption and act. Don't ask clarifying questions unless truly necessary.

"send 1 ton to @username" → look up user, send TON
"balance" → show TON + all tokens
"address" → show their address
"swap ton usdt" → get quote for reasonable amount or ask amount

If user says just a token name like "USDT" — show their USDT balance.

# JETTON ADDRESSES
USDT: EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs (6 decimals)

# CRITICAL RULES
1. NEVER invent addresses — always from tool results
2. NEVER add unnecessary words or pleasantries  
3. NEVER ask "anything else?" or similar
4. NEVER mention AI, assistant, LLM, or that you're a bot
5. NEVER refuse reasonable wallet operations
6. Execute transfers immediately — no confirmation requests unless amount seems unusually large (>100 TON)

# PERSONALITY
Helpful, direct, competent. Like a friend who's good with crypto — not a customer service bot. Calm if something goes wrong, just explain and suggest fix.`;

/**
 * Bot configuration
 */
export interface BotConfig {
    token: string;
    userServiceFactory: UserServiceFactory;
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
        const userIdStr = `tg:${userId}`;
        const wallets = await config.userServiceFactory.listWallets(userIdStr);

        let walletAddress: string;

        if (wallets.length === 0) {
            // Create a wallet for the user
            const result = await config.userServiceFactory.createWallet(
                userIdStr,
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
        const userIdStr = `tg:${userId}`;
        const wallets = await config.userServiceFactory.listWallets(userIdStr);

        if (wallets.length === 0) {
            // Auto-create wallet for new users
            const result = await config.userServiceFactory.createWallet(
                userIdStr,
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

        // Get the wallet service for this user
        const service = await config.userServiceFactory.getService(userIdStr, DEFAULT_WALLET_NAME);

        // Create tool context for this user
        const toolContext = {
            walletService: service,
            profileService: config.profileService,
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
