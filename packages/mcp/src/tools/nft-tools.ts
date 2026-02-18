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

export const getNftsSchema = z.object({
    limit: z.number().min(1).max(100).optional().describe('Maximum number of NFTs to return (default: 20, max: 100)'),
    offset: z.number().min(0).optional().describe('Offset for pagination (default: 0)'),
});

export const getNftSchema = z.object({
    nftAddress: z.string().min(1).describe('NFT item contract address'),
});

export const sendNftSchema = z.object({
    nftAddress: z.string().min(1).describe('NFT item contract address to transfer'),
    toAddress: z.string().min(1).describe('Recipient TON address'),
    comment: z.string().optional().describe('Optional comment/memo for the transaction'),
});

export function createMcpNftTools(service: McpWalletService) {
    return {
        get_nfts: {
            description:
                'List all NFTs (non-fungible tokens) in the wallet with their metadata, collection info, and attributes.',
            inputSchema: getNftsSchema,
            handler: async (args: z.infer<typeof getNftsSchema>): Promise<ToolResponse> => {
                try {
                    const nfts = await service.getNfts(args.limit ?? 20, args.offset ?? 0);

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        nfts: nfts.map((nft) => ({
                                            address: nft.address,
                                            name: nft.name,
                                            description: nft.description,
                                            image: nft.image,
                                            collection: nft.collection,
                                            attributes: nft.attributes,
                                            isOnSale: nft.isOnSale,
                                            isSoulbound: nft.isSoulbound,
                                        })),
                                        count: nfts.length,
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

        get_nft: {
            description: 'Get detailed information about a specific NFT by its address.',
            inputSchema: getNftSchema,
            handler: async (args: z.infer<typeof getNftSchema>): Promise<ToolResponse> => {
                try {
                    const nft = await service.getNft(args.nftAddress);

                    if (!nft) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: 'NFT not found',
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
                                        nft: {
                                            address: nft.address,
                                            name: nft.name,
                                            description: nft.description,
                                            image: nft.image,
                                            collection: nft.collection,
                                            attributes: nft.attributes,
                                            ownerAddress: nft.ownerAddress,
                                            isOnSale: nft.isOnSale,
                                            isSoulbound: nft.isSoulbound,
                                            saleContractAddress: nft.saleContractAddress,
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

        send_nft: {
            description: 'Transfer an NFT from the wallet to another address.',
            inputSchema: sendNftSchema,
            handler: async (args: z.infer<typeof sendNftSchema>): Promise<ToolResponse> => {
                try {
                    const result = await service.sendNft(args.nftAddress, args.toAddress, args.comment);

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: result.success,
                                        message: result.message,
                                        nftAddress: args.nftAddress,
                                        recipient: args.toAddress,
                                    },
                                    null,
                                    2,
                                ),
                            },
                        ],
                        isError: !result.success,
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
