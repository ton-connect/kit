/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Wallet management MCP tools
 */

import { z } from 'zod';

import type { WalletService } from '../services/WalletService.js';

export const createWalletSchema = z.object({
    name: z.string().min(1).describe('Unique name for the wallet'),
    version: z
        .enum(['v5r1', 'v4r2'])
        .optional()
        .describe('Wallet version (v5r1 recommended, v4r2 for legacy compatibility). Defaults to v5r1.'),
    network: z
        .enum(['mainnet', 'testnet'])
        .optional()
        .describe('Network to create the wallet on. Defaults to the server configured network.'),
});

export const importWalletSchema = z.object({
    name: z.string().min(1).describe('Unique name for the wallet'),
    mnemonic: z.string().describe('24-word mnemonic phrase separated by spaces'),
    version: z
        .enum(['v5r1', 'v4r2'])
        .optional()
        .describe('Wallet version (v5r1 recommended, v4r2 for legacy compatibility). Defaults to v5r1.'),
    network: z
        .enum(['mainnet', 'testnet'])
        .optional()
        .describe('Network to import the wallet on. Defaults to the server configured network.'),
});

export const removeWalletSchema = z.object({
    name: z.string().min(1).describe('Name of the wallet to remove'),
});

export function createWalletTools(walletService: WalletService) {
    return {
        create_wallet: {
            description:
                'Create a new TON wallet with a generated mnemonic. Returns the wallet address and mnemonic (save it securely!).',
            inputSchema: createWalletSchema,
            handler: async (args: z.infer<typeof createWalletSchema>) => {
                const result = await walletService.createWallet(args.name, args.version, args.network);
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify(
                                {
                                    success: true,
                                    wallet: {
                                        name: result.name,
                                        address: result.address,
                                        network: result.network,
                                        mnemonic: result.mnemonic.join(' '),
                                    },
                                    warning:
                                        'IMPORTANT: Save your mnemonic phrase securely! It cannot be recovered if lost.',
                                },
                                null,
                                2,
                            ),
                        },
                    ],
                };
            },
        },

        import_wallet: {
            description: 'Import an existing TON wallet using a 24-word mnemonic phrase.',
            inputSchema: importWalletSchema,
            handler: async (args: z.infer<typeof importWalletSchema>) => {
                const mnemonicWords = args.mnemonic.trim().split(/\s+/);
                if (mnemonicWords.length !== 24) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify({
                                    success: false,
                                    error: `Invalid mnemonic: expected 24 words, got ${mnemonicWords.length}`,
                                }),
                            },
                        ],
                        isError: true,
                    };
                }

                const result = await walletService.importWallet(args.name, mnemonicWords, args.version, args.network);
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify(
                                {
                                    success: true,
                                    wallet: {
                                        name: result.name,
                                        address: result.address,
                                        network: result.network,
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

        list_wallets: {
            description: 'List all stored TON wallets with their addresses and metadata.',
            inputSchema: z.object({}),
            handler: async () => {
                const wallets = await walletService.listWallets();
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify(
                                {
                                    success: true,
                                    wallets: wallets.map((w) => ({
                                        name: w.name,
                                        address: w.address,
                                        network: w.network,
                                        version: w.version,
                                        createdAt: w.createdAt,
                                    })),
                                    count: wallets.length,
                                },
                                null,
                                2,
                            ),
                        },
                    ],
                };
            },
        },

        remove_wallet: {
            description:
                'Remove a wallet from storage. This action cannot be undone - make sure you have backed up the mnemonic!',
            inputSchema: removeWalletSchema,
            handler: async (args: z.infer<typeof removeWalletSchema>) => {
                const removed = await walletService.removeWallet(args.name);
                if (!removed) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify({
                                    success: false,
                                    error: `Wallet "${args.name}" not found`,
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
                            text: JSON.stringify({
                                success: true,
                                message: `Wallet "${args.name}" has been removed`,
                            }),
                        },
                    ],
                };
            },
        },
    };
}
