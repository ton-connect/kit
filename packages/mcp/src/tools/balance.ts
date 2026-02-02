/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Balance query MCP tools
 *
 * All balance responses include both raw and human-readable amounts:
 * - rawBalance: The balance in smallest units (nanoTON for TON, raw units for jettons)
 * - balance: Human-readable amount with proper decimal formatting
 */

import { z } from 'zod';

import type { WalletService } from '../services/WalletService.js';

/**
 * Converts raw units to human-readable amount.
 *
 * @param rawAmount - Raw amount as string (e.g., "1500000000")
 * @param decimals - Number of decimal places for the token
 * @returns Human-readable amount as string (e.g., "1.5")
 *
 * @example
 * fromRawAmount("1500000000", 9)  // "1.5" (1.5 TON)
 * fromRawAmount("1000", 6)        // "0.001" (0.001 USDT)
 * fromRawAmount("100000000000", 9) // "100" (100 TON)
 */
function fromRawAmount(rawAmount: string, decimals: number): string {
    if (decimals === 0) return rawAmount;

    const padded = rawAmount.padStart(decimals + 1, '0');
    const intPart = padded.slice(0, -decimals) || '0';
    const fracPart = padded.slice(-decimals).replace(/0+$/, '');

    return fracPart ? `${intPart}.${fracPart}` : intPart;
}

/** TON has 9 decimal places (1 TON = 1,000,000,000 nanoTON) */
const TON_DECIMALS = 9;

export const getBalanceSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to check balance for'),
});

export const getJettonBalanceSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to check balance for'),
    jettonAddress: z.string().min(1).describe('Jetton master contract address'),
});

export const getJettonsSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to list jettons for'),
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

export function createBalanceTools(walletService: WalletService) {
    return {
        get_balance: {
            description:
                'Get the TON balance for a wallet. Returns both human-readable TON amount and raw nanoTON value.',
            inputSchema: getBalanceSchema,
            handler: async (args: z.infer<typeof getBalanceSchema>) => {
                try {
                    const rawBalance = await walletService.getBalance(args.wallet);
                    const balance = fromRawAmount(rawBalance, TON_DECIMALS);

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        wallet: args.wallet,
                                        balance: {
                                            ton: balance,
                                            nanoTon: rawBalance,
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
        },

        get_jetton_balance: {
            description:
                'Get the balance of a specific Jetton (token) for a wallet. Returns both human-readable and raw balance. Will fail if token decimals cannot be determined.',
            inputSchema: getJettonBalanceSchema,
            handler: async (args: z.infer<typeof getJettonBalanceSchema>) => {
                try {
                    const rawBalance = await walletService.getJettonBalance(args.wallet, args.jettonAddress);

                    // Fetch jetton info to get decimals - required for accurate display
                    let decimals: number | undefined;
                    let symbol: string | undefined;

                    try {
                        const jettons = await walletService.getJettons(args.wallet);
                        const jetton = jettons.find(
                            (j) => j.address.toLowerCase() === args.jettonAddress.toLowerCase(),
                        );
                        if (jetton) {
                            decimals = jetton.decimals;
                            symbol = jetton.symbol;
                        }
                    } catch (fetchError) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: `Failed to fetch jetton info: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}. Cannot display accurate balance without knowing token decimals.`,
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    // Strict validation - never guess decimals
                    if (decimals === undefined) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: `Cannot determine decimals for jetton ${args.jettonAddress}. Returning raw balance only.`,
                                        rawBalance: rawBalance,
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    const balance = fromRawAmount(rawBalance, decimals);

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        wallet: args.wallet,
                                        jettonAddress: args.jettonAddress,
                                        balance: {
                                            amount: balance,
                                            symbol: symbol || 'tokens',
                                            rawAmount: rawBalance,
                                            decimals: decimals,
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
        },

        get_jettons: {
            description:
                'List all Jettons (tokens) held by a wallet with their balances and metadata. Returns human-readable balances only for tokens with known decimals.',
            inputSchema: getJettonsSchema,
            handler: async (args: z.infer<typeof getJettonsSchema>) => {
                try {
                    const jettons = await walletService.getJettons(args.wallet);

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        wallet: args.wallet,
                                        jettons: jettons.map((j) => {
                                            const decimals = j.decimals;
                                            // Only show human-readable balance if decimals are known
                                            const balance =
                                                decimals !== undefined ? fromRawAmount(j.balance, decimals) : null;
                                            return {
                                                address: j.address,
                                                balance: balance,
                                                rawBalance: j.balance,
                                                name: j.name || 'Unknown',
                                                symbol: j.symbol || 'Unknown',
                                                decimals: decimals ?? 'unknown',
                                            };
                                        }),
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
        },

        get_transactions: {
            description:
                'Get recent transaction history for a wallet. Returns events with actions like TON transfers, Jetton transfers, swaps, and more.',
            inputSchema: getTransactionsSchema,
            handler: async (args: z.infer<typeof getTransactionsSchema>) => {
                try {
                    const transactions = await walletService.getTransactions(args.wallet, args.limit ?? 20);

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
                                                          ton: fromRawAmount(tx.amount, TON_DECIMALS),
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
        },
    };
}

export { fromRawAmount, TON_DECIMALS };
