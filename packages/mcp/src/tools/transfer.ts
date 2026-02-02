/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Transfer MCP tools for sending TON and Jettons
 *
 * Amount handling:
 * - User provides human-readable amounts (e.g., "1.5" TON or "0.001" USDT)
 * - Tool converts to raw units using token decimals (TON has 9 decimals, most jettons have 6-9)
 * - Conversion: rawAmount = userAmount * 10^decimals
 */

import { z } from 'zod';

import type { WalletService } from '../services/WalletService.js';

/**
 * Converts a human-readable amount to raw units (smallest denomination).
 *
 * @param amount - Human-readable amount as string (e.g., "1.5", "0.001")
 * @param decimals - Number of decimal places for the token (e.g., 9 for TON, 6 for USDT)
 * @returns Raw amount as string (e.g., "1500000000" for 1.5 TON)
 *
 * @example
 * toRawAmount("1.5", 9)    // "1500000000" (1.5 TON)
 * toRawAmount("0.001", 6)  // "1000" (0.001 USDT with 6 decimals)
 * toRawAmount("100", 9)    // "100000000000" (100 TON)
 */
function toRawAmount(amount: string, decimals: number): string {
    // Split into integer and fractional parts
    const [intPart, fracPart = ''] = amount.split('.');

    // Pad or truncate fractional part to match decimals
    const paddedFrac = fracPart.padEnd(decimals, '0').slice(0, decimals);

    // Combine and remove leading zeros (but keep at least one digit)
    const raw = (intPart + paddedFrac).replace(/^0+/, '') || '0';

    return raw;
}

/**
 * Converts raw units to human-readable amount.
 *
 * @param rawAmount - Raw amount as string (e.g., "1500000000")
 * @param decimals - Number of decimal places for the token
 * @returns Human-readable amount as string (e.g., "1.5")
 */
function fromRawAmount(rawAmount: string, decimals: number): string {
    const padded = rawAmount.padStart(decimals + 1, '0');
    const intPart = padded.slice(0, -decimals) || '0';
    const fracPart = padded.slice(-decimals).replace(/0+$/, '');

    return fracPart ? `${intPart}.${fracPart}` : intPart;
}

/** TON has 9 decimal places (1 TON = 1,000,000,000 nanoTON) */
const TON_DECIMALS = 9;

export const sendTonSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to send from'),
    toAddress: z.string().min(1).describe('Recipient TON address'),
    amount: z.string().min(1).describe('Amount of TON to send (e.g., "1.5" for 1.5 TON, "0.001" for 0.001 TON)'),
    comment: z.string().optional().describe('Optional comment/memo for the transaction'),
});

export const sendJettonSchema = z.object({
    wallet: z.string().min(1).describe('Name of the wallet to send from'),
    toAddress: z.string().min(1).describe('Recipient TON address'),
    jettonAddress: z.string().min(1).describe('Jetton master contract address'),
    amount: z
        .string()
        .min(1)
        .describe(
            'Amount of tokens to send in human-readable format (e.g., "100" for 100 tokens, "0.5" for 0.5 tokens)',
        ),
    comment: z.string().optional().describe('Optional comment/memo for the transaction'),
});

export function createTransferTools(walletService: WalletService) {
    return {
        send_ton: {
            description:
                'Send TON from a wallet to an address. Amount is in TON (e.g., "1.5" means 1.5 TON). The tool automatically converts to nanoTON. Make sure the wallet has enough balance for the amount plus gas fees (~0.05 TON).',
            inputSchema: sendTonSchema,
            handler: async (args: z.infer<typeof sendTonSchema>) => {
                // Convert human-readable TON amount to nanoTON
                const rawAmount = toRawAmount(args.amount, TON_DECIMALS);

                const result = await walletService.sendTon(args.wallet, args.toAddress, rawAmount, args.comment);

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
                                        rawAmount: `${rawAmount} nanoTON`,
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
                'Send Jettons (tokens) from a wallet to an address. Amount is in human-readable format (e.g., "100" for 100 tokens, "0.001" for 0.001 tokens). The tool fetches token decimals and converts automatically. The wallet needs TON for gas fees (~0.05 TON). Will fail if token decimals cannot be determined.',
            inputSchema: sendJettonSchema,
            handler: async (args: z.infer<typeof sendJettonSchema>) => {
                // Fetch jetton info to get decimals - MUST succeed, no guessing with user funds
                let decimals: number | undefined;
                let symbol: string | undefined;

                try {
                    const jettons = await walletService.getJettons(args.wallet);
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
                                    error: `Failed to fetch jetton info: ${error instanceof Error ? error.message : 'Unknown error'}. Cannot proceed without knowing token decimals.`,
                                }),
                            },
                        ],
                        isError: true,
                    };
                }

                // Strict validation - never guess decimals for user funds
                if (decimals === undefined) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify({
                                    success: false,
                                    error: `Cannot determine decimals for jetton ${args.jettonAddress}. The token may not be in your wallet or the address is incorrect. Cannot proceed without knowing token decimals to avoid sending incorrect amounts.`,
                                }),
                            },
                        ],
                        isError: true,
                    };
                }

                // Convert human-readable amount to raw units
                const rawAmount = toRawAmount(args.amount, decimals);

                const result = await walletService.sendJetton(
                    args.wallet,
                    args.toAddress,
                    args.jettonAddress,
                    rawAmount,
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
                                        rawAmount: rawAmount,
                                        decimals: decimals,
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

export { toRawAmount, fromRawAmount, TON_DECIMALS };
