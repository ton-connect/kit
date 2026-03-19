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
import { wrapToolHandler } from './responses.js';
import { sanitizeNetworkConfig, sanitizePrivateKeyBackedValue, sanitizeStoredWallet } from './sanitize.js';

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
        .describe('Optional wallet id, name, or address. Uses the active wallet when omitted.')
});

const pendingOperatorKeyRotationSchema = z.object({
    rotationId: z.string().min(1).describe('Pending operator key rotation identifier'),
});

export function createMcpWalletManagementTools(registry: WalletRegistryService) {
    return {
        list_wallets: {
            description: 'List all wallets stored in the local TON config registry.',
            inputSchema: z.object({}),
            handler: wrapToolHandler(async () => {
                const wallets = await registry.listWallets();
                const current = await registry.getCurrentWallet();
                return {
                    wallets: wallets.map((wallet) => sanitizeStoredWallet(wallet)),
                    count: wallets.length,
                    activeWalletId: current?.id ?? null,
                };
            }),
        },

        get_current_wallet: {
            description: 'Get the currently active wallet from the local TON config registry.',
            inputSchema: z.object({}),
            handler: wrapToolHandler(async () => {
                const wallet = await registry.getCurrentWallet();
                return { wallet: sanitizeStoredWallet(wallet) };
            }),
        },

        set_active_wallet: {
            description: 'Set the active wallet by id, name, or address.',
            inputSchema: setActiveWalletSchema,
            handler: wrapToolHandler(async (args: z.infer<typeof setActiveWalletSchema>) => {
                const wallet = await registry.setActiveWallet(args.walletSelector);
                return { wallet: sanitizeStoredWallet(wallet), activeWalletId: wallet.id };
            }),
        },

        remove_wallet: {
            description: 'Soft-delete a stored wallet from the local TON config registry.',
            inputSchema: removeWalletSchema,
            handler: wrapToolHandler(async (args: z.infer<typeof removeWalletSchema>) =>
                registry.removeWallet(args.walletSelector),
            ),
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
            handler: wrapToolHandler(async (args: z.infer<typeof setNetworkConfigSchema>) => {
                const config = await registry.setNetworkConfig(args.network, {
                    ...(args.toncenterApiKey !== undefined ? { toncenter_api_key: args.toncenterApiKey } : {}),
                    ...(args.agenticCollectionAddress !== undefined
                        ? { agentic_collection_address: args.agenticCollectionAddress }
                        : {}),
                });
                return {
                    network: args.network,
                    config: sanitizeNetworkConfig(config),
                };
            }),
        },

        validate_agentic_wallet: {
            description: 'Validate an existing agentic wallet address against the expected network and collection.',
            inputSchema: validateAgenticWalletSchema,
            handler: wrapToolHandler(async (args: z.infer<typeof validateAgenticWalletSchema>) => ({
                wallet: await registry.validateAgenticWallet(args),
            })),
        },

        list_agentic_wallets_by_owner: {
            description: 'List agentic wallets owned by a given main wallet address.',
            inputSchema: listAgenticWalletsByOwnerSchema,
            handler: wrapToolHandler(async (args: z.infer<typeof listAgenticWalletsByOwnerSchema>) => {
                const wallets = await registry.listAgenticWalletsByOwner(args);
                return {
                    ownerAddress: args.ownerAddress,
                    network: normalizeNetwork(args.network, 'mainnet'),
                    wallets,
                    count: wallets.length,
                };
            }),
        },

        import_agentic_wallet: {
            description:
                'Import an existing agentic wallet into the local TON config registry. Recovers a matching pending key draft when available; otherwise import is read-only until agentic_rotate_operator_key is completed.',
            inputSchema: importAgenticWalletSchema,
            handler: wrapToolHandler(async (args: z.infer<typeof importAgenticWalletSchema>) => {
                const result = await registry.importAgenticWallet(args);
                return {
                    ...result,
                    wallet: sanitizeStoredWallet(result.wallet),
                };
            }),
        },

        rotate_operator_key: {
            description:
                'Start agentic operator key rotation: generate or accept a replacement operator key, persist a pending draft, and return a dashboard URL for the on-chain change. Agents with shell/browser access should open the dashboard URL instead of asking the user to copy it manually.',
            inputSchema: rotateOperatorKeySchema,
            handler: wrapToolHandler(async (args: z.infer<typeof rotateOperatorKeySchema>) => {
                const result = await registry.startAgenticKeyRotation(args);
                return {
                    ...result,
                    wallet: sanitizeStoredWallet(result.wallet),
                    pendingRotation: sanitizePrivateKeyBackedValue(result.pendingRotation),
                };
            }),
        },

        list_pending_operator_key_rotations: {
            description: 'List pending agentic operator key rotations stored in the local TON config registry.',
            inputSchema: z.object({}),
            handler: wrapToolHandler(async () => {
                const rotations = await registry.listPendingAgenticKeyRotations();
                return {
                    rotations: rotations.map((rotation) => sanitizePrivateKeyBackedValue(rotation)),
                    count: rotations.length,
                };
            }),
        },

        get_pending_operator_key_rotation: {
            description: 'Get one pending agentic operator key rotation by id.',
            inputSchema: pendingOperatorKeyRotationSchema,
            handler: wrapToolHandler(async (args: z.infer<typeof pendingOperatorKeyRotationSchema>) => {
                const rotation = await registry.getPendingAgenticKeyRotation(args.rotationId);
                return {
                    rotation: rotation ? sanitizePrivateKeyBackedValue(rotation) : null,
                };
            }),
        },

        complete_rotate_operator_key: {
            description:
                'Complete an agentic operator key rotation after the dashboard transaction lands on chain, then update the stored operator key locally.',
            inputSchema: pendingOperatorKeyRotationSchema,
            handler: wrapToolHandler(async (args: z.infer<typeof pendingOperatorKeyRotationSchema>) => {
                const result = await registry.completeAgenticKeyRotation(args.rotationId);
                return {
                    ...result,
                    wallet: sanitizeStoredWallet(result.wallet),
                    pendingRotation: sanitizePrivateKeyBackedValue(result.pendingRotation),
                };
            }),
        },

        cancel_rotate_operator_key: {
            description: 'Cancel a pending agentic operator key rotation and discard its stored replacement key.',
            inputSchema: pendingOperatorKeyRotationSchema,
            handler: wrapToolHandler(async (args: z.infer<typeof pendingOperatorKeyRotationSchema>) => {
                await registry.cancelAgenticKeyRotation(args.rotationId);
                return { rotationId: args.rotationId, cancelled: true };
            }),
        },
    };
}
