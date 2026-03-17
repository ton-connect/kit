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

const TON_AMOUNT_REGEX = /^\d+(?:\.\d{1,9})?$/;

const agenticMetadataSchema = z
    .object({
        name: z.string().min(1).describe('Sub-wallet display name stored as NFT metadata (TEP-64).'),
    })
    .catchall(z.union([z.string(), z.number(), z.boolean()]));

export const deployAgenticSubwalletSchema = z.object({
    operatorPublicKey: z
        .string()
        .min(1)
        .describe('Public key for the new sub-wallet operator (uint256, decimal or 0x-prefixed hex).'),
    metadata: agenticMetadataSchema.describe('Required onchain NFT metadata (TEP-64). Must include at least `name`.'),
    amountTon: z.string().optional().describe('TON amount to attach for deployment in TON units (default: "0.05").'),
});

export function createMcpAgenticTools(service: McpWalletService) {
    return {
        deploy_agentic_subwallet: {
            description:
                'Deploy a new Agentic sub-wallet from the current Agentic root wallet. Works only when WALLET_VERSION=agentic and current wallet is deployedByUser=true. Returns normalizedHash and the new sub-wallet address.',
            inputSchema: deployAgenticSubwalletSchema,
            handler: async (args: z.infer<typeof deployAgenticSubwalletSchema>): Promise<ToolResponse> => {
                try {
                    const amountTon = args.amountTon ?? '0.05';
                    if (!TON_AMOUNT_REGEX.test(amountTon)) {
                        throw new Error('amountTon must be a positive TON value with up to 9 decimals');
                    }

                    const result = await service.deployAgenticSubwallet({
                        operatorPublicKey: args.operatorPublicKey,
                        amountNano: toRawAmount(amountTon, TON_DECIMALS),
                        metadata: args.metadata,
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
                                            normalizedHash: result.normalizedHash,
                                            subwalletAddress: result.subwalletAddress,
                                            subwalletNftIndex: result.subwalletNftIndex,
                                            ownerAddress: result.ownerAddress,
                                            collectionAddress: result.collectionAddress,
                                            operatorPublicKey: result.operatorPublicKey,
                                            metadata: args.metadata,
                                            amountTon,
                                            amountNano: result.amountNano,
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
    };
}
