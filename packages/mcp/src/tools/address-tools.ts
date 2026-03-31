/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { z } from 'zod';
import { formatUnits } from '@ton/walletkit';

import type { McpWalletService } from '../services/McpWalletService.js';
import type { ToolResponse } from './types.js';

export const getBalanceByAddressSchema = z.object({
    address: z.string().min(1).describe('TON wallet address'),
});

export const getJettonsByAddressSchema = z.object({
    address: z.string().min(1).describe('Owner wallet address'),
    limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe('Maximum number of jettons to return (default: 20, max: 100)'),
    offset: z.number().min(0).optional().describe('Offset for pagination (default: 0)'),
});

export const getNftsByAddressSchema = z.object({
    address: z.string().min(1).describe('Owner wallet address'),
    limit: z.number().min(1).max(100).optional().describe('Maximum number of NFTs to return (default: 20, max: 100)'),
    offset: z.number().min(0).optional().describe('Offset for pagination (default: 0)'),
});

export const getJettonInfoSchema = z.object({
    jettonAddress: z.string().min(1).describe('Jetton master contract address'),
});

export const getJettonWalletAddressSchema = z.object({
    jettonAddress: z.string().min(1).describe('Jetton master contract address'),
    ownerAddress: z.string().min(1).describe('Owner wallet address'),
});

export function createMcpAddressTools(service: McpWalletService) {
    return {
        get_balance_by_address: {
            description:
                'Get TON balance for any wallet address. Returns both human-readable and raw (nanoTON) values.',
            inputSchema: getBalanceByAddressSchema,
            handler: async (args: z.infer<typeof getBalanceByAddressSchema>): Promise<ToolResponse> => {
                try {
                    const result = await service.getBalanceByAddress(args.address);

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        address: result.address,
                                        amountRaw: result.balanceNano,
                                        amount: result.balanceTon,
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

        get_jettons_by_address: {
            description: 'List Jettons held by any address with balances and metadata.',
            inputSchema: getJettonsByAddressSchema,
            handler: async (args: z.infer<typeof getJettonsByAddressSchema>): Promise<ToolResponse> => {
                try {
                    const limit = args.limit ?? 20;
                    const offset = args.offset ?? 0;
                    const jettons = await service.getJettonsByAddress(args.address, limit, offset);

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        address: args.address,
                                        jettons: jettons.map((j) => ({
                                            address: j.address,
                                            name: j.name,
                                            symbol: j.symbol,
                                            decimals: j.decimals,
                                            amountRaw: j.balance,
                                            amount: formatUnits(j.balance, j.decimals ?? 9),
                                        })),
                                        count: jettons.length,
                                        limit,
                                        offset,
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

        get_nfts_by_address: {
            description: 'List NFTs held by any address with metadata, collection info, and attributes.',
            inputSchema: getNftsByAddressSchema,
            handler: async (args: z.infer<typeof getNftsByAddressSchema>): Promise<ToolResponse> => {
                try {
                    const limit = args.limit ?? 20;
                    const offset = args.offset ?? 0;
                    const nfts = await service.getNftsByAddress(args.address, limit, offset);

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        address: args.address,
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
                                        limit,
                                        offset,
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

        get_jetton_info: {
            description: 'Get metadata (name, symbol, decimals, image, URI) for a Jetton master contract.',
            inputSchema: getJettonInfoSchema,
            handler: async (args: z.infer<typeof getJettonInfoSchema>): Promise<ToolResponse> => {
                try {
                    const jettonInfo = await service.getJettonInfo(args.jettonAddress);

                    if (!jettonInfo) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: 'Jetton not found',
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
                                        jetton: jettonInfo,
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

        // get_jetton_wallet_address: {
        //     description: 'Get the jetton-wallet address for a given Jetton master and owner address.',
        //     inputSchema: getJettonWalletAddressSchema,
        //     handler: async (args: z.infer<typeof getJettonWalletAddressSchema>): Promise<ToolResponse> => {
        //         try {
        //             const jettonWalletAddress = await service.getJettonWalletAddress(
        //                 args.jettonAddress,
        //                 args.ownerAddress,
        //             );

        //             return {
        //                 content: [
        //                     {
        //                         type: 'text' as const,
        //                         text: JSON.stringify(
        //                             {
        //                                 success: true,
        //                                 jettonAddress: args.jettonAddress,
        //                                 ownerAddress: args.ownerAddress,
        //                                 jettonWalletAddress,
        //                             },
        //                             null,
        //                             2,
        //                         ),
        //                     },
        //                 ],
        //             };
        //         } catch (error) {
        //             return {
        //                 content: [
        //                     {
        //                         type: 'text' as const,
        //                         text: JSON.stringify({
        //                             success: false,
        //                             error: error instanceof Error ? error.message : 'Unknown error',
        //                         }),
        //                     },
        //                 ],
        //                 isError: true,
        //             };
        //         }
        //     },
        // },
    };
}
