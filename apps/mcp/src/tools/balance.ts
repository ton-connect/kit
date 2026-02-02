/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Balance query MCP tools
 */

import { z } from 'zod';

import type { WalletService } from '../services/WalletService.js';

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

export function createBalanceTools(walletService: WalletService) {
    return {
        get_balance: {
            description:
                'Get the TON balance for a wallet. Returns balance in nanoTON (1 TON = 1,000,000,000 nanoTON).',
            inputSchema: getBalanceSchema,
            handler: async (args: z.infer<typeof getBalanceSchema>) => {
                try {
                    const balance = await walletService.getBalance(args.wallet);
                    const tonBalance = (BigInt(balance) / BigInt(1_000_000_000)).toString();
                    const nanoRemainder = (BigInt(balance) % BigInt(1_000_000_000)).toString();

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        wallet: args.wallet,
                                        balance: {
                                            nanoTon: balance,
                                            ton: `${tonBalance}.${nanoRemainder.padStart(9, '0')}`,
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
                'Get the balance of a specific Jetton (token) for a wallet. Returns raw balance (apply decimals based on token).',
            inputSchema: getJettonBalanceSchema,
            handler: async (args: z.infer<typeof getJettonBalanceSchema>) => {
                try {
                    const balance = await walletService.getJettonBalance(args.wallet, args.jettonAddress);

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        wallet: args.wallet,
                                        jettonAddress: args.jettonAddress,
                                        balance: balance,
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
            description: 'List all Jettons (tokens) held by a wallet with their balances and metadata.',
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
                                        jettons: jettons.map((j) => ({
                                            address: j.address,
                                            balance: j.balance,
                                            name: j.name || 'Unknown',
                                            symbol: j.symbol || 'Unknown',
                                            decimals: j.decimals ?? 9,
                                        })),
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
    };
}
