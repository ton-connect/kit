/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * MCP tools for multi-user deployments with authentication
 *
 * These tools wrap the McpWalletService with user isolation.
 * They are used by the createTonWalletMCP factory.
 */

import { z } from 'zod';
import type { SwapQuote } from '@ton/walletkit';

import type { McpWalletService } from '../services/McpWalletService.js';

// Tool response type - must be compatible with MCP SDK's expected return type
interface ToolResponse {
    [key: string]: unknown;
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
}

// Handler wrapper type
type AuthenticatedHandlerWrapper = <TArgs, TResult>(
    handler: (args: TArgs, userId: string, service: McpWalletService) => Promise<TResult>,
) => (args: TArgs, extra: unknown) => Promise<TResult>;

/**
 * Converts a human-readable amount to raw units.
 */
function toRawAmount(amount: string, decimals: number): string {
    const [intPart, fracPart = ''] = amount.split('.');
    const paddedFrac = fracPart.padEnd(decimals, '0').slice(0, decimals);
    const raw = (intPart + paddedFrac).replace(/^0+/, '') || '0';
    return raw;
}

const TON_DECIMALS = 9;

// ============================================
// Wallet Tools
// ============================================

export const createWalletSchema = z.object({
    name: z.string().min(1).describe('Unique name for the wallet'),
    version: z
        .enum(['v5r1', 'v4r2'])
        .optional()
        .describe('Wallet version (v5r1 recommended, v4r2 for legacy compatibility). Defaults to v5r1.'),
    network: z
        .enum(['mainnet', 'testnet'])
        .optional()
        .describe('Network to create the wallet on. Defaults to the server configured network.'),
});

export const importWalletSchema = z.object({
    name: z.string().min(1).describe('Unique name for the wallet'),
    mnemonic: z.string().describe('24-word mnemonic phrase separated by spaces'),
    version: z
        .enum(['v5r1', 'v4r2'])
        .optional()
        .describe('Wallet version (v5r1 recommended, v4r2 for legacy compatibility). Defaults to v5r1.'),
    network: z
        .enum(['mainnet', 'testnet'])
        .optional()
        .describe('Network to import the wallet on. Defaults to the server configured network.'),
});

export const removeWalletSchema = z.object({
    name: z.string().min(1).describe('Name of the wallet to remove'),
});

export function createMcpWalletTools(_walletService: McpWalletService, wrapHandler: AuthenticatedHandlerWrapper) {
    return {
        create_wallet: {
            description:
                'Create a new TON wallet. The wallet is created securely and you will receive the address. No seed phrase is exposed.',
            inputSchema: createWalletSchema,
            handler: wrapHandler(
                async (
                    args: z.infer<typeof createWalletSchema>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userSigner = service.createUserSigner(userId);
                    const userStorage = service.createUserStorage(userId);

                    try {
                        const result = await service.createWallet(
                            userSigner,
                            userStorage,
                            args.name,
                            args.version,
                            args.network,
                        );

                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify(
                                        {
                                            success: true,
                                            wallet: {
                                                name: result.name,
                                                address: result.address,
                                                network: result.network,
                                            },
                                        },
                                        null,
                                        2,
                                    ),
                                },
                            ],
                        };
                    } catch (error) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: error instanceof Error ? error.message : 'Unknown error',
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }
                },
            ),
        },

        import_wallet: {
            description:
                'Import an existing TON wallet using a 24-word mnemonic phrase. The mnemonic is stored securely and never exposed.',
            inputSchema: importWalletSchema,
            handler: wrapHandler(
                async (
                    args: z.infer<typeof importWalletSchema>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const mnemonicWords = args.mnemonic.trim().split(/\s+/);
                    if (mnemonicWords.length !== 24) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: `Invalid mnemonic: expected 24 words, got ${mnemonicWords.length}`,
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    const userSigner = service.createUserSigner(userId);
                    const userStorage = service.createUserStorage(userId);

                    try {
                        const result = await service.importWallet(
                            userSigner,
                            userStorage,
                            args.name,
                            mnemonicWords,
                            args.version,
                            args.network,
                        );

                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify(
                                        {
                                            success: true,
                                            wallet: {
                                                name: result.name,
                                                address: result.address,
                                                network: result.network,
                                            },
                                        },
                                        null,
                                        2,
                                    ),
                                },
                            ],
                        };
                    } catch (error) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: error instanceof Error ? error.message : 'Unknown error',
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }
                },
            ),
        },

        list_wallets: {
            description: 'List all your stored TON wallets with their addresses and metadata.',
            inputSchema: z.object({}),
            handler: wrapHandler(
                async (
                    _args: Record<string, never>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userSigner = service.createUserSigner(userId);

                    const wallets = await service.listWallets(userSigner);
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        wallets: wallets.map((w) => ({
                                            name: w.name,
                                            address: w.address,
                                            network: w.network,
                                            version: w.version,
                                            createdAt: w.createdAt,
                                        })),
                                        count: wallets.length,
                                    },
                                    null,
                                    2,
                                ),
                            },
                        ],
                    };
                },
            ),
        },

        remove_wallet: {
            description: 'Remove a wallet from storage. This action cannot be undone!',
            inputSchema: removeWalletSchema,
            handler: wrapHandler(
                async (
                    args: z.infer<typeof removeWalletSchema>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userSigner = service.createUserSigner(userId);
                    const userStorage = service.createUserStorage(userId);

                    const removed = await service.removeWallet(userSigner, userStorage, args.name);
                    if (!removed) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: 'Wallet not found',
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify({
                                    success: true,
                                    message: `Wallet "${args.name}" has been removed`,
                                }),
                            },
                        ],
                    };
                },
            ),
        },
    };
}

// ============================================
// Balance Tools
// ============================================

export const getBalanceSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to check balance'),
});

export const getJettonBalanceSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet'),
    jettonAddress: z.string().min(1).describe('Jetton master contract address'),
});

export const getJettonsSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet'),
});

export const getTransactionsSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to get transactions for'),
    limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe('Maximum number of transactions to return (default: 20, max: 100)'),
});

export function createMcpBalanceTools(_walletService: McpWalletService, wrapHandler: AuthenticatedHandlerWrapper) {
    return {
        get_balance: {
            description: 'Get the TON balance of a wallet. Returns both human-readable and raw (nanoTON) amounts.',
            inputSchema: getBalanceSchema,
            handler: wrapHandler(
                async (
                    args: z.infer<typeof getBalanceSchema>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userSigner = service.createUserSigner(userId);

                    try {
                        const balance = await service.getBalance(userSigner, args.wallet);
                        const balanceTon = Number(BigInt(balance)) / 1e9;

                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify(
                                        {
                                            success: true,
                                            wallet: args.wallet,
                                            balance: `${balanceTon} TON`,
                                            balanceNano: balance,
                                        },
                                        null,
                                        2,
                                    ),
                                },
                            ],
                        };
                    } catch (error) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: error instanceof Error ? error.message : 'Unknown error',
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }
                },
            ),
        },

        get_jetton_balance: {
            description: 'Get the balance of a specific Jetton (token) in a wallet.',
            inputSchema: getJettonBalanceSchema,
            handler: wrapHandler(
                async (
                    args: z.infer<typeof getJettonBalanceSchema>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userSigner = service.createUserSigner(userId);

                    try {
                        const balance = await service.getJettonBalance(userSigner, args.wallet, args.jettonAddress);

                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify(
                                        {
                                            success: true,
                                            wallet: args.wallet,
                                            jettonAddress: args.jettonAddress,
                                            balance,
                                        },
                                        null,
                                        2,
                                    ),
                                },
                            ],
                        };
                    } catch (error) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: error instanceof Error ? error.message : 'Unknown error',
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }
                },
            ),
        },

        get_jettons: {
            description: 'List all Jettons (tokens) in a wallet with their balances and metadata.',
            inputSchema: getJettonsSchema,
            handler: wrapHandler(
                async (
                    args: z.infer<typeof getJettonsSchema>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userSigner = service.createUserSigner(userId);

                    try {
                        const jettons = await service.getJettons(userSigner, args.wallet);

                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify(
                                        {
                                            success: true,
                                            wallet: args.wallet,
                                            jettons,
                                            count: jettons.length,
                                        },
                                        null,
                                        2,
                                    ),
                                },
                            ],
                        };
                    } catch (error) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: error instanceof Error ? error.message : 'Unknown error',
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }
                },
            ),
        },

        get_transactions: {
            description:
                'Get recent transaction history for a wallet. Returns events with actions like TON transfers, Jetton transfers, swaps, and more.',
            inputSchema: getTransactionsSchema,
            handler: wrapHandler(
                async (
                    args: z.infer<typeof getTransactionsSchema>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userSigner = service.createUserSigner(userId);

                    try {
                        const transactions = await service.getTransactions(userSigner, args.wallet, args.limit ?? 20);

                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify(
                                        {
                                            success: true,
                                            wallet: args.wallet,
                                            transactions: transactions.map((tx) => ({
                                                eventId: tx.eventId,
                                                timestamp: tx.timestamp,
                                                date: new Date(tx.timestamp * 1000).toISOString(),
                                                type: tx.type,
                                                status: tx.status,
                                                description: tx.description,
                                                isScam: tx.isScam,
                                                // TON transfer details
                                                ...(tx.type === 'TonTransfer' && {
                                                    from: tx.from,
                                                    to: tx.to,
                                                    amount: tx.amount
                                                        ? {
                                                              ton: (Number(BigInt(tx.amount)) / 1e9).toString(),
                                                              nanoTon: tx.amount,
                                                          }
                                                        : null,
                                                    comment: tx.comment,
                                                }),
                                                // Jetton transfer details
                                                ...(tx.type === 'JettonTransfer' && {
                                                    from: tx.from,
                                                    to: tx.to,
                                                    jettonAddress: tx.jettonAddress,
                                                    jettonSymbol: tx.jettonSymbol,
                                                    jettonAmount: tx.jettonAmount,
                                                    comment: tx.comment,
                                                }),
                                                // Swap details
                                                ...(tx.type === 'JettonSwap' && {
                                                    dex: tx.dex,
                                                    amountIn: tx.amountIn,
                                                    amountOut: tx.amountOut,
                                                    jettonSymbol: tx.jettonSymbol,
                                                }),
                                            })),
                                            count: transactions.length,
                                        },
                                        null,
                                        2,
                                    ),
                                },
                            ],
                        };
                    } catch (error) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: error instanceof Error ? error.message : 'Unknown error',
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }
                },
            ),
        },
    };
}

// ============================================
// Transfer Tools
// ============================================

export const sendTonSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to send from'),
    toAddress: z.string().min(1).describe('Recipient TON address'),
    amount: z.string().min(1).describe('Amount of TON to send (e.g., "1.5" for 1.5 TON)'),
    comment: z.string().optional().describe('Optional comment/memo for the transaction'),
});

export const sendJettonSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to send from'),
    toAddress: z.string().min(1).describe('Recipient TON address'),
    jettonAddress: z.string().min(1).describe('Jetton master contract address'),
    amount: z.string().min(1).describe('Amount of tokens to send in human-readable format'),
    comment: z.string().optional().describe('Optional comment/memo for the transaction'),
});

export function createMcpTransferTools(_walletService: McpWalletService, wrapHandler: AuthenticatedHandlerWrapper) {
    return {
        send_ton: {
            description:
                'Send TON from a wallet to an address. Amount is in TON (e.g., "1.5" means 1.5 TON). May require confirmation if enabled.',
            inputSchema: sendTonSchema,
            handler: wrapHandler(
                async (
                    args: z.infer<typeof sendTonSchema>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userSigner = service.createUserSigner(userId);
                    const userStorage = service.createUserStorage(userId);

                    const rawAmount = toRawAmount(args.amount, TON_DECIMALS);

                    const result = await service.sendTon(
                        userSigner,
                        userStorage,
                        args.wallet,
                        args.toAddress,
                        rawAmount,
                        args.amount,
                        args.comment,
                    );

                    if (!result.success) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: result.message,
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        message: result.message,
                                        details: {
                                            from: args.wallet,
                                            to: args.toAddress,
                                            amount: `${args.amount} TON`,
                                            comment: args.comment || null,
                                            pendingTransactionId: result.pendingTransactionId || null,
                                        },
                                    },
                                    null,
                                    2,
                                ),
                            },
                        ],
                    };
                },
            ),
        },

        send_jetton: {
            description:
                'Send Jettons (tokens) from a wallet to an address. Amount is in human-readable format. May require confirmation if enabled.',
            inputSchema: sendJettonSchema,
            handler: wrapHandler(
                async (
                    args: z.infer<typeof sendJettonSchema>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userSigner = service.createUserSigner(userId);
                    const userStorage = service.createUserStorage(userId);

                    // Fetch jetton info for decimals
                    let decimals: number | undefined;
                    let symbol: string | undefined;

                    try {
                        const jettons = await service.getJettons(userSigner, args.wallet);
                        const jetton = jettons.find(
                            (j) => j.address.toLowerCase() === args.jettonAddress.toLowerCase(),
                        );
                        if (jetton) {
                            decimals = jetton.decimals;
                            symbol = jetton.symbol;
                        }
                    } catch (error) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: `Failed to fetch jetton info: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    if (decimals === undefined) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: `Cannot determine decimals for jetton ${args.jettonAddress}. The token may not be in your wallet.`,
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    const rawAmount = toRawAmount(args.amount, decimals);

                    const result = await service.sendJetton(
                        userSigner,
                        userStorage,
                        args.wallet,
                        args.toAddress,
                        args.jettonAddress,
                        rawAmount,
                        args.amount,
                        symbol,
                        decimals,
                        args.comment,
                    );

                    if (!result.success) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: result.message,
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        message: result.message,
                                        details: {
                                            from: args.wallet,
                                            to: args.toAddress,
                                            jettonAddress: args.jettonAddress,
                                            amount: `${args.amount} ${symbol || 'tokens'}`,
                                            comment: args.comment || null,
                                            pendingTransactionId: result.pendingTransactionId || null,
                                        },
                                    },
                                    null,
                                    2,
                                ),
                            },
                        ],
                    };
                },
            ),
        },
    };
}

// ============================================
// Swap Tools
// ============================================

// Store quotes temporarily for execution
const quoteCache = new Map<string, { quote: SwapQuote; expiresAt: number; userId: string }>();

function generateQuoteId(): string {
    return `quote_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function cleanExpiredQuotes(): void {
    const now = Date.now();
    for (const [id, data] of quoteCache.entries()) {
        if (data.expiresAt < now) {
            quoteCache.delete(id);
        }
    }
}

export const getSwapQuoteSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to swap from'),
    fromToken: z.string().min(1).describe('Token to swap from ("TON" or jetton address)'),
    toToken: z.string().min(1).describe('Token to swap to ("TON" or jetton address)'),
    amount: z.string().min(1).describe('Amount to swap in raw units'),
    slippageBps: z.number().optional().describe('Slippage tolerance in basis points (default 100 = 1%)'),
});

export const executeSwapSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to execute swap from'),
    quoteId: z.string().min(1).describe('Quote ID returned from get_swap_quote'),
});

export function createMcpSwapTools(_walletService: McpWalletService, wrapHandler: AuthenticatedHandlerWrapper) {
    return {
        get_swap_quote: {
            description: 'Get a quote for swapping tokens. Returns a quote ID to use with execute_swap.',
            inputSchema: getSwapQuoteSchema,
            handler: wrapHandler(
                async (
                    args: z.infer<typeof getSwapQuoteSchema>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userSigner = service.createUserSigner(userId);

                    try {
                        cleanExpiredQuotes();

                        const result = await service.getSwapQuote(
                            userSigner,
                            args.wallet,
                            args.fromToken,
                            args.toToken,
                            args.amount,
                            args.slippageBps,
                        );

                        // Store quote with user ID for ownership check
                        const quoteId = generateQuoteId();
                        const expiresAt = result.expiresAt ? result.expiresAt * 1000 : Date.now() + 60000;
                        quoteCache.set(quoteId, { quote: result.quote, expiresAt, userId });

                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify(
                                        {
                                            success: true,
                                            quoteId,
                                            fromToken: result.fromToken,
                                            toToken: result.toToken,
                                            fromAmount: result.fromAmount,
                                            toAmount: result.toAmount,
                                            minReceived: result.minReceived,
                                            provider: result.provider,
                                            expiresAt: result.expiresAt
                                                ? new Date(result.expiresAt * 1000).toISOString()
                                                : null,
                                            note: 'Use the quoteId with execute_swap to complete the swap.',
                                        },
                                        null,
                                        2,
                                    ),
                                },
                            ],
                        };
                    } catch (error) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: error instanceof Error ? error.message : 'Unknown error',
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }
                },
            ),
        },

        execute_swap: {
            description: 'Execute a token swap using a quote. May require confirmation if enabled.',
            inputSchema: executeSwapSchema,
            handler: wrapHandler(
                async (
                    args: z.infer<typeof executeSwapSchema>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userSigner = service.createUserSigner(userId);
                    const userStorage = service.createUserStorage(userId);

                    cleanExpiredQuotes();

                    const cachedQuote = quoteCache.get(args.quoteId);

                    if (!cachedQuote) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: 'Quote not found or expired. Please get a new quote.',
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    // Verify quote ownership
                    if (cachedQuote.userId !== userId) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: 'Quote not found or expired. Please get a new quote.',
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    if (cachedQuote.expiresAt < Date.now()) {
                        quoteCache.delete(args.quoteId);
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: 'Quote has expired. Please get a new quote.',
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    const result = await service.executeSwap(userSigner, userStorage, args.wallet, cachedQuote.quote);

                    // Remove used quote
                    quoteCache.delete(args.quoteId);

                    if (!result.success) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: result.message,
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        message: result.message,
                                        details: {
                                            fromToken: cachedQuote.quote.fromToken,
                                            toToken: cachedQuote.quote.toToken,
                                            fromAmount: cachedQuote.quote.fromAmount,
                                            toAmount: cachedQuote.quote.toAmount,
                                            provider: cachedQuote.quote.providerId,
                                            pendingTransactionId: result.pendingTransactionId || null,
                                        },
                                    },
                                    null,
                                    2,
                                ),
                            },
                        ],
                    };
                },
            ),
        },
    };
}

// ============================================
// Pending Transaction Tools
// ============================================

export const confirmTransactionSchema = z.object({
    transactionId: z.string().min(1).describe('ID of the pending transaction to confirm'),
});

export const cancelTransactionSchema = z.object({
    transactionId: z.string().min(1).describe('ID of the pending transaction to cancel'),
});

export function createMcpPendingTools(_walletService: McpWalletService, wrapHandler: AuthenticatedHandlerWrapper) {
    return {
        confirm_transaction: {
            description: 'Confirm and execute a pending transaction.',
            inputSchema: confirmTransactionSchema,
            handler: wrapHandler(
                async (
                    args: z.infer<typeof confirmTransactionSchema>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userSigner = service.createUserSigner(userId);
                    const userStorage = service.createUserStorage(userId);

                    const result = await service.confirmTransaction(userSigner, userStorage, args.transactionId);

                    if (!result.success) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: result.message,
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        message: result.message,
                                    },
                                    null,
                                    2,
                                ),
                            },
                        ],
                    };
                },
            ),
        },

        cancel_transaction: {
            description: 'Cancel a pending transaction.',
            inputSchema: cancelTransactionSchema,
            handler: wrapHandler(
                async (
                    args: z.infer<typeof cancelTransactionSchema>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userStorage = service.createUserStorage(userId);

                    const cancelled = await service.cancelTransaction(userStorage, args.transactionId);

                    if (!cancelled) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: 'Transaction not found or already processed',
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify({
                                    success: true,
                                    message: 'Transaction cancelled',
                                }),
                            },
                        ],
                    };
                },
            ),
        },

        list_pending_transactions: {
            description: 'List all pending transactions awaiting confirmation.',
            inputSchema: z.object({}),
            handler: wrapHandler(
                async (
                    _args: Record<string, never>,
                    userId: string,
                    service: McpWalletService,
                ): Promise<ToolResponse> => {
                    const userStorage = service.createUserStorage(userId);

                    const pending = await service.listPendingTransactions(userStorage);

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        transactions: pending.map((tx) => ({
                                            id: tx.id,
                                            type: tx.type,
                                            wallet: tx.walletName,
                                            description: tx.description,
                                            createdAt: tx.createdAt,
                                            expiresAt: tx.expiresAt,
                                        })),
                                        count: pending.length,
                                    },
                                    null,
                                    2,
                                ),
                            },
                        ],
                    };
                },
            ),
        },
    };
}
