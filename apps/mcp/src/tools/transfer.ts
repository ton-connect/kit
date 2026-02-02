/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Transfer MCP tools for sending TON and Jettons
 */

import { z } from 'zod';

import type { WalletService } from '../services/WalletService.js';

export const sendTonSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to send from'),
    toAddress: z.string().min(1).describe('Recipient TON address'),
    amount: z.string().min(1).describe('Amount to send in nanoTON (1 TON = 1,000,000,000 nanoTON)'),
    comment: z.string().optional().describe('Optional comment/memo for the transaction'),
});

export const sendJettonSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to send from'),
    toAddress: z.string().min(1).describe('Recipient TON address'),
    jettonAddress: z.string().min(1).describe('Jetton master contract address'),
    amount: z.string().min(1).describe('Amount to send in raw units (apply decimals yourself)'),
    comment: z.string().optional().describe('Optional comment/memo for the transaction'),
});

export function createTransferTools(walletService: WalletService) {
    return {
        send_ton: {
            description:
                'Send TON from a wallet to an address. Amount is in nanoTON (1 TON = 1,000,000,000 nanoTON). Make sure the wallet has enough balance for the amount plus gas fees.',
            inputSchema: sendTonSchema,
            handler: async (args: z.infer<typeof sendTonSchema>) => {
                const result = await walletService.sendTon(args.wallet, args.toAddress, args.amount, args.comment);

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
                                        amount: args.amount,
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
            description:
                'Send Jettons (tokens) from a wallet to an address. Amount is in raw units - apply the token decimals yourself. The wallet needs TON for gas fees.',
            inputSchema: sendJettonSchema,
            handler: async (args: z.infer<typeof sendJettonSchema>) => {
                const result = await walletService.sendJetton(
                    args.wallet,
                    args.toAddress,
                    args.jettonAddress,
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
                                        jettonAddress: args.jettonAddress,
                                        amount: args.amount,
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
    };
}
