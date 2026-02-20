/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { z } from 'zod';

import type { McpWalletService } from '../services/McpWalletService.js';
import type { ToolResponse } from './types.js';

export const getWalletSchema = z.object({});

export const getBalanceSchema = z.object({});

export const getJettonBalanceSchema = z.object({
    jettonAddress: z.string().min(1).describe('Jetton master contract address'),
});

export const getJettonsSchema = z.object({});

export const getTransactionsSchema = z.object({
    limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe('Maximum number of transactions to return (default: 20, max: 100)'),
});

export function createMcpBalanceTools(service: McpWalletService) {
    return {
        get_wallet: {
            description: 'Get current wallet address and network information.',
            inputSchema: getWalletSchema,
            handler: async (): Promise<ToolResponse> => {
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify(
                                {
                                    success: true,
                                    address: service.getAddress(),
                                    network: service.getNetwork(),
                                },
                                null,
                                2,
                            ),
                        },
                    ],
                };
            },
        },

        get_balance: {
            description: 'Get the TON balance of the wallet. Returns both human-readable and raw (nanoTON) amounts.',
            inputSchema: getBalanceSchema,
            handler: async (): Promise<ToolResponse> => {
                try {
                    const balance = await service.getBalance();
                    const balanceTon = Number(BigInt(balance)) / 1e9;

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        address: service.getAddress(),
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
        },

        get_jetton_balance: {
            description: 'Get the balance of a specific Jetton (token) in the wallet.',
            inputSchema: getJettonBalanceSchema,
            handler: async (args: z.infer<typeof getJettonBalanceSchema>): Promise<ToolResponse> => {
                try {
                    const balance = await service.getJettonBalance(args.jettonAddress);

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
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
        },

        get_jettons: {
            description: 'List all Jettons (tokens) in the wallet with their balances and metadata.',
            inputSchema: getJettonsSchema,
            handler: async (): Promise<ToolResponse> => {
                try {
                    const jettons = await service.getJettons();

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
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
        },

        get_transactions: {
            description:
                'Get recent transaction history for the wallet. Returns events with actions like TON transfers, Jetton transfers, swaps, and more.',
            inputSchema: getTransactionsSchema,
            handler: async (args: z.infer<typeof getTransactionsSchema>): Promise<ToolResponse> => {
                try {
                    const transactions = await service.getTransactions(args.limit ?? 20);

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
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
        },
    };
}
