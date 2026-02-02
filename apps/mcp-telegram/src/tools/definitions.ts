/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Tool definitions for the LLM
 *
 * These tools wrap McpWalletService methods and are called by the LLM
 * to perform wallet operations on behalf of users.
 */

import type { McpWalletService, UserScopedSigner, UserScopedStorage } from '@ton/mcp';

import type { ToolDefinition } from '../services/LLMService.js';
import type { ProfileService } from '../services/ProfileService.js';

/**
 * Context passed to tool handlers
 */
export interface ToolContext {
    walletService: McpWalletService;
    userSigner: UserScopedSigner;
    userStorage: UserScopedStorage;
    profileService: ProfileService;
    walletName: string;
}

/**
 * Create tool definitions with the given context
 */
export function createToolDefinitions(context: ToolContext): ToolDefinition[] {
    const { walletService, userSigner, userStorage, profileService, walletName } = context;

    return [
        // Balance tools
        {
            name: 'check_balance',
            description: 'Check the TON balance of the wallet. Returns the balance in TON.',
            parameters: {
                type: 'object',
                properties: {},
            },
            handler: async () => {
                const balance = await walletService.getBalance(userSigner, walletName);
                const balanceTon = (Number(balance) / 1e9).toFixed(4);

                // Also get address for context (useful when balance is 0)
                const wallets = await walletService.listWallets(userSigner);
                const wallet = wallets.find((w) => w.name === walletName);

                return {
                    balance: balanceTon,
                    unit: 'TON',
                    raw: balance,
                    walletAddress: wallet?.address,
                    hint:
                        Number(balance) === 0 ? 'Balance is 0. Show the walletAddress so user can top up!' : undefined,
                };
            },
        },
        {
            name: 'get_jettons',
            description: 'Get all Jetton (token) balances in the wallet. Returns a list of tokens with their balances.',
            parameters: {
                type: 'object',
                properties: {},
            },
            handler: async () => {
                const jettons = await walletService.getJettons(userSigner, walletName);
                return {
                    jettons: jettons.map((j) => ({
                        symbol: j.symbol ?? 'Unknown',
                        name: j.name ?? 'Unknown Token',
                        balance: j.balance,
                        address: j.address,
                    })),
                };
            },
        },

        // Wallet info tools
        {
            name: 'get_wallet_address',
            description:
                'Get the wallet address. ALWAYS use this when user asks for address. Copy the exact address from result.',
            parameters: {
                type: 'object',
                properties: {},
            },
            handler: async () => {
                const wallets = await walletService.listWallets(userSigner);
                const wallet = wallets.find((w) => w.name === walletName);
                if (!wallet) {
                    return { error: 'Wallet not found' };
                }
                return {
                    address: wallet.address,
                    network: wallet.network,
                    instruction: 'Show this EXACT address to user. Do not modify it!',
                };
            },
        },

        // Transaction history
        {
            name: 'get_transaction_history',
            description: 'Get recent transaction history for the wallet.',
            parameters: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number',
                        description: 'Number of transactions to retrieve (default: 10, max: 50)',
                    },
                },
            },
            handler: async (args: Record<string, unknown>) => {
                const limit = Math.min((args.limit as number) ?? 10, 50);
                const transactions = await walletService.getTransactions(userSigner, walletName, limit);
                return {
                    transactions: transactions.map((tx) => ({
                        type: tx.type,
                        status: tx.status,
                        timestamp: new Date(tx.timestamp * 1000).toISOString(),
                        from: tx.from,
                        to: tx.to,
                        amount: tx.amount ? (Number(tx.amount) / 1e9).toFixed(4) + ' TON' : undefined,
                        jettonAmount: tx.jettonAmount,
                        jettonSymbol: tx.jettonSymbol,
                        comment: tx.comment,
                        description: tx.description,
                    })),
                };
            },
        },

        // Transfer tools
        {
            name: 'send_ton',
            description:
                'Send TON to an address or @username. The amount should be in TON (e.g., 1.5 means 1.5 TON). Can optionally include a comment.',
            parameters: {
                type: 'object',
                properties: {
                    recipient: {
                        type: 'string',
                        description: 'Recipient address or @username',
                    },
                    amount: {
                        type: 'number',
                        description: 'Amount in TON to send (e.g., 1.5)',
                    },
                    comment: {
                        type: 'string',
                        description: 'Optional comment to include with the transfer',
                    },
                },
                required: ['recipient', 'amount'],
            },
            handler: async (args: Record<string, unknown>) => {
                const recipient = args.recipient as string;
                const amount = args.amount as number;
                const comment = args.comment as string | undefined;

                // Resolve @username to address if needed
                let toAddress = recipient;
                if (recipient.startsWith('@')) {
                    const resolved = profileService.resolveUsernameToAddress(recipient);
                    if (!resolved) {
                        return { error: `User ${recipient} not found` };
                    }
                    toAddress = resolved;
                }

                // Convert TON to nanoTON
                const amountNano = BigInt(Math.floor(amount * 1e9)).toString();

                const result = await walletService.sendTon(
                    userSigner,
                    userStorage,
                    walletName,
                    toAddress,
                    amountNano,
                    amount.toString(),
                    comment,
                );

                return result;
            },
        },
        {
            name: 'send_jetton',
            description: 'Send Jetton (token) to an address or @username. Specify the token by address or symbol.',
            parameters: {
                type: 'object',
                properties: {
                    recipient: {
                        type: 'string',
                        description: 'Recipient address or @username',
                    },
                    jetton_address: {
                        type: 'string',
                        description: 'Jetton contract address',
                    },
                    amount: {
                        type: 'number',
                        description: 'Amount to send (in human-readable units)',
                    },
                    comment: {
                        type: 'string',
                        description: 'Optional comment to include with the transfer',
                    },
                },
                required: ['recipient', 'jetton_address', 'amount'],
            },
            handler: async (args: Record<string, unknown>) => {
                const recipient = args.recipient as string;
                const jettonAddress = args.jetton_address as string;
                const amount = args.amount as number;
                const comment = args.comment as string | undefined;

                // Resolve @username to address if needed
                let toAddress = recipient;
                if (recipient.startsWith('@')) {
                    const resolved = profileService.resolveUsernameToAddress(recipient);
                    if (!resolved) {
                        return { error: `User ${recipient} not found` };
                    }
                    toAddress = resolved;
                }

                // Get jetton info to get decimals
                const jettons = await walletService.getJettons(userSigner, walletName);
                const jetton = jettons.find((j) => j.address === jettonAddress);
                const decimals = jetton?.decimals ?? 9;
                const symbol = jetton?.symbol;

                // Convert to raw amount
                const amountRaw = BigInt(Math.floor(amount * Math.pow(10, decimals))).toString();

                const result = await walletService.sendJetton(
                    userSigner,
                    userStorage,
                    walletName,
                    toAddress,
                    jettonAddress,
                    amountRaw,
                    amount.toString(),
                    symbol,
                    decimals,
                    comment,
                );

                return result;
            },
        },

        // Swap tools
        {
            name: 'get_swap_quote',
            description:
                'Preview a swap quote. ALWAYS call this first to check the price before executing. Use "TON" for native TON, or token address for Jettons. After checking the quote, call the swap tool to execute.',
            parameters: {
                type: 'object',
                properties: {
                    from_token: {
                        type: 'string',
                        description: 'Token to swap from (e.g., "TON" or jetton address)',
                    },
                    to_token: {
                        type: 'string',
                        description: 'Token to swap to (e.g., "TON" or jetton address)',
                    },
                    amount: {
                        type: 'string',
                        description: 'Amount to swap (in raw units)',
                    },
                },
                required: ['from_token', 'to_token', 'amount'],
            },
            handler: async (args: Record<string, unknown>) => {
                const fromToken = args.from_token as string;
                const toToken = args.to_token as string;
                const amount = args.amount as string;

                const quote = await walletService.getSwapQuote(userSigner, walletName, fromToken, toToken, amount);

                return {
                    fromToken: quote.fromToken,
                    toToken: quote.toToken,
                    fromAmount: quote.fromAmount,
                    toAmount: quote.toAmount,
                    minReceived: quote.minReceived,
                    provider: quote.provider,
                    quoteId: JSON.stringify(quote.quote),
                };
            },
        },
        {
            name: 'execute_swap',
            description: 'Execute a swap using a previously obtained quote.',
            parameters: {
                type: 'object',
                properties: {
                    quote_id: {
                        type: 'string',
                        description: 'The quote ID from get_swap_quote',
                    },
                },
                required: ['quote_id'],
            },
            handler: async (args: Record<string, unknown>) => {
                const quoteId = args.quote_id as string;
                const quote = JSON.parse(quoteId);

                const result = await walletService.executeSwap(userSigner, userStorage, walletName, quote);

                return result;
            },
        },
        {
            name: 'swap',
            description:
                'Execute a swap. Only call after previewing with get_swap_quote and confirming the price is acceptable. Use "TON" for native TON, or token address for Jettons.',
            parameters: {
                type: 'object',
                properties: {
                    from_token: {
                        type: 'string',
                        description: 'Token to swap from (e.g., "TON" or jetton address)',
                    },
                    to_token: {
                        type: 'string',
                        description: 'Token to swap to (e.g., "TON" or jetton address)',
                    },
                    amount: {
                        type: 'string',
                        description: 'Amount to swap (in raw units)',
                    },
                },
                required: ['from_token', 'to_token', 'amount'],
            },
            handler: async (args: Record<string, unknown>) => {
                const fromToken = args.from_token as string;
                const toToken = args.to_token as string;
                const amount = args.amount as string;

                // Get fresh quote
                const quote = await walletService.getSwapQuote(userSigner, walletName, fromToken, toToken, amount);

                if (!quote.quote) {
                    return {
                        success: false,
                        message: 'Failed to get swap quote',
                    };
                }

                // Execute swap
                const result = await walletService.executeSwap(userSigner, userStorage, walletName, quote.quote);

                return {
                    success: result.success,
                    message: result.message,
                    fromToken: quote.fromToken,
                    toToken: quote.toToken,
                    fromAmount: quote.fromAmount,
                    toAmount: quote.toAmount,
                };
            },
        },

        // Profile/lookup tools
        {
            name: 'lookup_user',
            description: 'Look up a user by @username to find their wallet address.',
            parameters: {
                type: 'object',
                properties: {
                    username: {
                        type: 'string',
                        description: 'Telegram username (with or without @)',
                    },
                },
                required: ['username'],
            },
            handler: async (args: Record<string, unknown>) => {
                const username = args.username as string;
                const profile = profileService.findByUsername(username);

                if (!profile) {
                    return { found: false, message: `User ${username} not found` };
                }

                return {
                    found: true,
                    username: profile.username,
                    firstName: profile.firstName,
                    walletAddress: profile.walletAddress,
                };
            },
        },
    ];
}
