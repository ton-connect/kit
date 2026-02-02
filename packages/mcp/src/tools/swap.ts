/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Swap MCP tools for token swapping on TON blockchain
 *
 * Uses the Omniston (STON.fi) protocol for swap operations.
 * Swap flow:
 * 1. Get a quote using get_swap_quote
 * 2. Execute the swap using execute_swap with the quote
 */

import { z } from 'zod';
import type { SwapQuote } from '@ton/walletkit';

import type { WalletService } from '../services/WalletService.js';

// Store quotes temporarily for execution (quotes expire)
const quoteCache = new Map<string, { quote: SwapQuote; expiresAt: number }>();

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
    fromToken: z
        .string()
        .min(1)
        .describe('Token to swap from. Use "TON" for native TON, or jetton master contract address'),
    toToken: z
        .string()
        .min(1)
        .describe('Token to swap to. Use "TON" for native TON, or jetton master contract address'),
    amount: z.string().min(1).describe('Amount to swap in raw units (smallest denomination)'),
    slippageBps: z
        .number()
        .optional()
        .describe('Slippage tolerance in basis points (e.g., 100 = 1%). Default is 100 (1%)'),
});

export const executeSwapSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to execute swap from'),
    quoteId: z.string().min(1).describe('Quote ID returned from get_swap_quote'),
});

export function createSwapTools(walletService: WalletService) {
    return {
        get_swap_quote: {
            description:
                'Get a quote for swapping tokens on TON blockchain. Returns pricing information and a quote ID to use with execute_swap. Quotes expire after a short time, so execute promptly. Amount should be in raw units (e.g., for TON with 9 decimals, "1500000000" = 1.5 TON).',
            inputSchema: getSwapQuoteSchema,
            handler: async (args: z.infer<typeof getSwapQuoteSchema>) => {
                try {
                    // Clean expired quotes periodically
                    cleanExpiredQuotes();

                    const result = await walletService.getSwapQuote(
                        args.wallet,
                        args.fromToken,
                        args.toToken,
                        args.amount,
                        args.slippageBps,
                    );

                    // Store quote for later execution
                    const quoteId = generateQuoteId();
                    const expiresAt = result.expiresAt ? result.expiresAt * 1000 : Date.now() + 60000; // Default 1 min
                    quoteCache.set(quoteId, { quote: result.quote, expiresAt });

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
                                        note: 'Use the quoteId with execute_swap to complete the swap. Quote expires soon.',
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
        },

        execute_swap: {
            description:
                'Execute a token swap using a quote obtained from get_swap_quote. The quote must not be expired. Make sure the wallet has enough balance for the swap amount plus gas fees (~0.1 TON for swap transactions).',
            inputSchema: executeSwapSchema,
            handler: async (args: z.infer<typeof executeSwapSchema>) => {
                // Clean expired quotes
                cleanExpiredQuotes();

                const cachedQuote = quoteCache.get(args.quoteId);

                if (!cachedQuote) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify({
                                    success: false,
                                    error: 'Quote not found or expired. Please get a new quote using get_swap_quote.',
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
                                    error: 'Quote has expired. Please get a new quote using get_swap_quote.',
                                }),
                            },
                        ],
                        isError: true,
                    };
                }

                const result = await walletService.executeSwap(args.wallet, cachedQuote.quote);

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
                                        provider: cachedQuote.quote.provider,
                                    },
                                },
                                null,
                                2,
                            ),
                        },
                    ],
                };
            },
        },
    };
}
