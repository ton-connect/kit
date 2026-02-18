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

export const getSwapQuoteSchema = z.object({
    fromToken: z.string().min(1).describe('Token to swap from ("TON" or jetton address)'),
    toToken: z.string().min(1).describe('Token to swap to ("TON" or jetton address)'),
    amount: z.string().min(1).describe('Amount to swap in human-readable format (e.g., "1.5" for 1.5 TON)'),
    slippageBps: z.number().optional().describe('Slippage tolerance in basis points (default 100 = 1%)'),
});

export function createMcpSwapTools(service: McpWalletService) {
    return {
        get_swap_quote: {
            description:
                'Get a quote for swapping tokens. Returns quote details and transaction params. If user confirms, use send_raw_transaction to execute.',
            inputSchema: getSwapQuoteSchema,
            handler: async (args: z.infer<typeof getSwapQuoteSchema>): Promise<ToolResponse> => {
                try {
                    const result = await service.getSwapQuote(
                        args.fromToken,
                        args.toToken,
                        args.amount,
                        args.slippageBps,
                    );

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        quote: {
                                            fromToken: result.fromToken,
                                            toToken: result.toToken,
                                            fromAmount: result.fromAmount,
                                            toAmount: result.toAmount,
                                            minReceived: result.minReceived,
                                            provider: result.provider,
                                            expiresAt: result.expiresAt
                                                ? new Date(result.expiresAt * 1000).toISOString()
                                                : null,
                                        },
                                        transaction: result.transaction,
                                        note: 'If user confirms, use send_raw_transaction with the transaction params to execute the swap.',
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
