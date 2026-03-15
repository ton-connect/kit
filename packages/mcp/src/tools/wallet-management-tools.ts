/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { z } from 'zod';

import type { WalletRegistryService } from '../services/WalletRegistryService.js';
import { normalizeNetwork } from '../registry/config.js';
import {
    sanitizeNetworkConfig,
    sanitizePendingAgenticKeyRotation,
    sanitizePendingAgenticKeyRotations,
    sanitizeWallet,
    sanitizeWallets,
} from './sanitize.js';
import type { ToolResponse } from './types.js';

function successResponse(data: unknown): ToolResponse {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ success: true, ...((data as object | null) ?? {}) }, null, 2),
            },
        ],
    };
}

function errorResponse(error: unknown): ToolResponse {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(
                    {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    },
                    null,
                    2,
                ),
            },
        ],
        isError: true,
    };
}

// const getNetworkConfigSchema = z.object({
//     network: z.enum(['mainnet', 'testnet']).describe('Network to inspect'),
// });

const setNetworkConfigSchema = z.object({
    network: z.enum(['mainnet', 'testnet']).describe('Network to update'),
    toncenterApiKey: z.string().optional().describe('Optional Toncenter API key for this network'),
    agenticCollectionAddress: z.string().optional().describe('Optional agentic collection address override'),
});

const setActiveWalletSchema = z.object({
    walletSelector: z.string().min(1).describe('Wallet id, name, or address'),
});

const removeWalletSchema = z.object({
    walletSelector: z.string().min(1).describe('Wallet id, name, or address to remove'),
});

const validateAgenticWalletSchema = z.object({
    address: z.string().min(1).describe('Agentic wallet address'),
    network: z.enum(['mainnet', 'testnet']).optional().describe('Network to validate against (default: mainnet)'),
    collectionAddress: z.string().optional().describe('Optional collection address override'),
    ownerAddress: z.string().optional().describe('Optional owner address expectation'),
});

const listAgenticWalletsByOwnerSchema = z.object({
    ownerAddress: z.string().min(1).describe('Owner wallet address'),
    network: z.enum(['mainnet', 'testnet']).optional().describe('Network to query (default: mainnet)'),
});

const importAgenticWalletSchema = z.object({
    address: z.string().min(1).describe('Agentic wallet address'),
    network: z.enum(['mainnet', 'testnet']).optional().describe('Network to validate against (default: mainnet)'),
    name: z.string().optional().describe('Optional wallet display name'),
});

const rotateOperatorKeySchema = z.object({
    walletSelector: z
        .string()
        .optional()
        .describe('Optional wallet id, name, or address. Uses the active wallet when omitted.'),
    operatorPrivateKey: z.string().optional().describe('Optional replacement operator private key'),
});

const pendingOperatorKeyRotationSchema = z.object({
    rotationId: z.string().min(1).describe('Pending operator key rotation identifier'),
});

export function createMcpWalletManagementTools(registry: WalletRegistryService) {
    return {
        list_wallets: {
            description: 'List all wallets stored in the local TON config registry.',
            inputSchema: z.object({}),
            handler: async (): Promise<ToolResponse> => {
                try {
                    const wallets = await registry.listWallets();
                    const current = await registry.getCurrentWallet();
                    return successResponse({
                        wallets: sanitizeWallets(wallets),
                        count: wallets.length,
                        activeWalletId: current?.id ?? null,
                    });
                } catch (error) {
                    return errorResponse(error);
                }
            },
        },

        get_current_wallet: {
            description: 'Get the currently active wallet from the local TON config registry.',
            inputSchema: z.object({}),
            handler: async (): Promise<ToolResponse> => {
                try {
                    const wallet = await registry.getCurrentWallet();
                    return successResponse({ wallet: sanitizeWallet(wallet) });
                } catch (error) {
                    return errorResponse(error);
                }
            },
        },

        set_active_wallet: {
            description: 'Set the active wallet by id, name, or address.',
            inputSchema: setActiveWalletSchema,
            handler: async (args: z.infer<typeof setActiveWalletSchema>): Promise<ToolResponse> => {
                try {
                    const wallet = await registry.setActiveWallet(args.walletSelector);
                    return successResponse({ wallet: sanitizeWallet(wallet), activeWalletId: wallet.id });
                } catch (error) {
                    return errorResponse(error);
                }
            },
        },

        remove_wallet: {
            description: 'Soft-delete a stored wallet from the local TON config registry.',
            inputSchema: removeWalletSchema,
            handler: async (args: z.infer<typeof removeWalletSchema>): Promise<ToolResponse> => {
                try {
                    const result = await registry.removeWallet(args.walletSelector);
                    return successResponse(result);
                } catch (error) {
                    return errorResponse(error);
                }
            },
        },

        // get_network_config: {
        //     description: 'Get Toncenter and agentic collection settings for a network.',
        //     inputSchema: getNetworkConfigSchema,
        //     handler: async (args: z.infer<typeof getNetworkConfigSchema>): Promise<ToolResponse> => {
        //         try {
        //             const config = await registry.getNetworkConfig(args.network);
        //             return successResponse({
        //                 network: args.network,
        //                 config: sanitizeNetworkConfig(config),
        //             });
        //         } catch (error) {
        //             return errorResponse(error);
        //         }
        //     },
        // },

        set_network_config: {
            description: 'Update Toncenter or agentic collection settings for a network.',
            inputSchema: setNetworkConfigSchema,
            handler: async (args: z.infer<typeof setNetworkConfigSchema>): Promise<ToolResponse> => {
                try {
                    const config = await registry.setNetworkConfig(args.network, {
                        ...(args.toncenterApiKey !== undefined ? { toncenter_api_key: args.toncenterApiKey } : {}),
                        ...(args.agenticCollectionAddress !== undefined
                            ? { agentic_collection_address: args.agenticCollectionAddress }
                            : {}),
                    });
                    return successResponse({
                        network: args.network,
                        config: sanitizeNetworkConfig(config),
                    });
                } catch (error) {
                    return errorResponse(error);
                }
            },
        },

        validate_agentic_wallet: {
            description: 'Validate an existing agentic wallet address against the expected network and collection.',
            inputSchema: validateAgenticWalletSchema,
            handler: async (args: z.infer<typeof validateAgenticWalletSchema>): Promise<ToolResponse> => {
                try {
                    const wallet = await registry.validateAgenticWallet(args);
                    return successResponse({ wallet });
                } catch (error) {
                    return errorResponse(error);
                }
            },
        },

        list_agentic_wallets_by_owner: {
            description: 'List agentic wallets owned by a given main wallet address.',
            inputSchema: listAgenticWalletsByOwnerSchema,
            handler: async (args: z.infer<typeof listAgenticWalletsByOwnerSchema>): Promise<ToolResponse> => {
                try {
                    const wallets = await registry.listAgenticWalletsByOwner(args);
                    return successResponse({
                        ownerAddress: args.ownerAddress,
                        network: normalizeNetwork(args.network, 'mainnet'),
                        wallets,
                        count: wallets.length,
                    });
                } catch (error) {
                    return errorResponse(error);
                }
            },
        },

        import_agentic_wallet: {
            description:
                'Import an existing agentic wallet into the local TON config registry. Recovers a matching pending key draft when available; otherwise import is read-only until agentic_rotate_operator_key is completed.',
            inputSchema: importAgenticWalletSchema,
            handler: async (args: z.infer<typeof importAgenticWalletSchema>): Promise<ToolResponse> => {
                try {
                    const result = await registry.importAgenticWallet(args);
                    return successResponse({
                        ...result,
                        wallet: sanitizeWallet(result.wallet),
                    });
                } catch (error) {
                    return errorResponse(error);
                }
            },
        },

        rotate_operator_key: {
            description:
                'Start agentic operator key rotation: generate or accept a replacement operator key, persist a pending draft, and return a dashboard URL for the on-chain change. Agents with shell/browser access should open the dashboard URL instead of asking the user to copy it manually.',
            inputSchema: rotateOperatorKeySchema,
            handler: async (args: z.infer<typeof rotateOperatorKeySchema>): Promise<ToolResponse> => {
                try {
                    const result = await registry.startAgenticKeyRotation(args);
                    return successResponse({
                        ...result,
                        wallet: sanitizeWallet(result.wallet),
                        pendingRotation: sanitizePendingAgenticKeyRotation(result.pendingRotation),
                    });
                } catch (error) {
                    return errorResponse(error);
                }
            },
        },

        list_pending_operator_key_rotations: {
            description: 'List pending agentic operator key rotations stored in the local TON config registry.',
            inputSchema: z.object({}),
            handler: async (): Promise<ToolResponse> => {
                try {
                    const rotations = await registry.listPendingAgenticKeyRotations();
                    return successResponse({
                        rotations: sanitizePendingAgenticKeyRotations(rotations),
                        count: rotations.length,
                    });
                } catch (error) {
                    return errorResponse(error);
                }
            },
        },

        get_pending_operator_key_rotation: {
            description: 'Get one pending agentic operator key rotation by id.',
            inputSchema: pendingOperatorKeyRotationSchema,
            handler: async (args: z.infer<typeof pendingOperatorKeyRotationSchema>): Promise<ToolResponse> => {
                try {
                    const rotation = await registry.getPendingAgenticKeyRotation(args.rotationId);
                    return successResponse({
                        rotation: rotation ? sanitizePendingAgenticKeyRotation(rotation) : null,
                    });
                } catch (error) {
                    return errorResponse(error);
                }
            },
        },

        complete_rotate_operator_key: {
            description:
                'Complete an agentic operator key rotation after the dashboard transaction lands on chain, then update the stored operator key locally.',
            inputSchema: pendingOperatorKeyRotationSchema,
            handler: async (args: z.infer<typeof pendingOperatorKeyRotationSchema>): Promise<ToolResponse> => {
                try {
                    const result = await registry.completeAgenticKeyRotation(args.rotationId);
                    return successResponse({
                        ...result,
                        wallet: sanitizeWallet(result.wallet),
                        pendingRotation: sanitizePendingAgenticKeyRotation(result.pendingRotation),
                    });
                } catch (error) {
                    return errorResponse(error);
                }
            },
        },

        cancel_rotate_operator_key: {
            description: 'Cancel a pending agentic operator key rotation and discard its stored replacement key.',
            inputSchema: pendingOperatorKeyRotationSchema,
            handler: async (args: z.infer<typeof pendingOperatorKeyRotationSchema>): Promise<ToolResponse> => {
                try {
                    await registry.cancelAgenticKeyRotation(args.rotationId);
                    return successResponse({ rotationId: args.rotationId, cancelled: true });
                } catch (error) {
                    return errorResponse(error);
                }
            },
        },
    };
}
