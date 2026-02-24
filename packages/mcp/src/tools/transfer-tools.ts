/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { z } from 'zod';

import type { McpWalletService } from '../services/McpWalletService.js';
import { toRawAmount, TON_DECIMALS } from './types.js';
import type { ToolResponse } from './types.js';

export const sendTonSchema = z.object({
    toAddress: z.string().min(1).describe('Recipient TON address'),
    amount: z.string().min(1).describe('Amount of TON to send (e.g., "1.5" for 1.5 TON)'),
    comment: z.string().optional().describe('Optional comment/memo for the transaction'),
});

export const sendJettonSchema = z.object({
    toAddress: z.string().min(1).describe('Recipient TON address'),
    jettonAddress: z.string().min(1).describe('Jetton master contract address'),
    amount: z.string().min(1).describe('Amount of tokens to send in human-readable format'),
    comment: z.string().optional().describe('Optional comment/memo for the transaction'),
});

const transactionMessageSchema = z.object({
    address: z.string().min(1).describe('Recipient wallet address'),
    amount: z.string().min(1).describe('Amount to transfer in nanotons'),
    stateInit: z.string().optional().describe('Initial state for deploying a new contract (Base64)'),
    payload: z.string().optional().describe('Message payload data (Base64)'),
});

export const sendRawTransactionSchema = z.object({
    messages: z.array(transactionMessageSchema).min(1).describe('Array of messages to include in the transaction'),
    validUntil: z.number().optional().describe('Unix timestamp after which the transaction becomes invalid'),
    fromAddress: z.string().optional().describe('Sender wallet address'),
});

export function createMcpTransferTools(service: McpWalletService) {
    return {
        send_ton: {
            description: 'Send TON from the wallet to an address. Amount is in TON (e.g., "1.5" means 1.5 TON).',
            inputSchema: sendTonSchema,
            handler: async (args: z.infer<typeof sendTonSchema>): Promise<ToolResponse> => {
                const rawAmount = toRawAmount(args.amount, TON_DECIMALS);

                const result = await service.sendTon(args.toAddress, rawAmount, args.comment);

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
                                        to: args.toAddress,
                                        amount: `${args.amount} TON`,
                                        comment: args.comment || null,
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

        send_jetton: {
            description: 'Send Jettons (tokens) from the wallet to an address. Amount is in human-readable format.',
            inputSchema: sendJettonSchema,
            handler: async (args: z.infer<typeof sendJettonSchema>): Promise<ToolResponse> => {
                // Fetch jetton info for decimals
                let decimals: number | undefined;
                let symbol: string | undefined;

                try {
                    const jettons = await service.getJettons();
                    const jetton = jettons.find((j) => j.address.toLowerCase() === args.jettonAddress.toLowerCase());
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

                const result = await service.sendJetton(args.toAddress, args.jettonAddress, rawAmount, args.comment);

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
                                        to: args.toAddress,
                                        jettonAddress: args.jettonAddress,
                                        amount: `${args.amount} ${symbol || 'tokens'}`,
                                        comment: args.comment || null,
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

        send_raw_transaction: {
            description:
                'Send a raw transaction with full control over messages. Amounts are in nanotons. Supports multiple messages in a single transaction.',
            inputSchema: sendRawTransactionSchema,
            handler: async (args: z.infer<typeof sendRawTransactionSchema>): Promise<ToolResponse> => {
                const result = await service.sendRawTransaction({
                    messages: args.messages,
                    validUntil: args.validUntil,
                    fromAddress: args.fromAddress,
                });

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
                                        messageCount: args.messages.length,
                                        messages: args.messages.map((m) => ({
                                            to: m.address,
                                            amount: `${m.amount} nanoTON`,
                                        })),
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
