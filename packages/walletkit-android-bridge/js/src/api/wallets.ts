/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * wallets.ts – Wallet management operations
 *
 * Simplified bridge for wallet creation, listing, removal, and state retrieval.
 */

import { CHAIN, type Hex } from '@ton/walletkit';

import type {
    RemoveWalletArgs,
    GetBalanceArgs,
    CreateSignerArgs,
    CreateAdapterArgs,
    AddWalletArgs,
    WalletKitWallet,
    WalletKitAdapter,
    WalletKitSigner,
} from '../types';
import { Signer, WalletV4R2Adapter, WalletV5R1Adapter } from '../core/moduleLoader';
import { walletKit } from '../core/state';
import { callBridge } from '../utils/bridgeWrapper';
import { signWithCustomSigner } from './cryptography';

type SignerInstance = WalletKitSigner;
type AdapterInstance = WalletKitAdapter;

/**
 * Lists all wallets with metadata.
 * Returns raw WalletKit wallet objects - Kotlin handles mapping to WalletDescriptor.
 */
export async function getWallets(): Promise<WalletKitWallet[]> {
    return callBridge('getWallets', async () => {
        return (walletKit.getWallets?.() ?? []) as WalletKitWallet[];
    });
}

/**
 * Get a single wallet by address.
 * Returns raw WalletKit wallet object - Kotlin handles mapping to WalletDescriptor.
 */
export async function getWallet(args: { address: string }): Promise<WalletKitWallet | null> {
    return callBridge('getWallet', async () => {
        if (!args.address) {
            throw new Error('Wallet address is required');
        }

        const wallet = walletKit.getWallet?.(args.address) as WalletKitWallet | undefined;
        return wallet ?? null;
    });
}

/**
 * Removes a wallet from storage.
 */
export async function removeWallet(args: RemoveWalletArgs) {
    return callBridge('removeWallet', async () => {
        if (!args.address) {
            throw new Error('Wallet address is required');
        }

        const wallet = walletKit.getWallet?.(args.address) as WalletKitWallet | undefined;
        if (!wallet) {
            return { removed: false };
        }

        await walletKit.removeWallet(args.address);
        return { removed: true };
    });
}

/**
 * Fetches wallet balance.
 * Returns raw balance value - Kotlin handles conversion to BigInteger.
 */
export async function getBalance(args: GetBalanceArgs) {
    return callBridge('getBalance', async () => {
        const wallet = walletKit.getWallet(args.address) as WalletKitWallet | undefined;
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        return await wallet.getBalance();
    });
}

// Store for signers and adapters
const signerStore = new Map<string, SignerInstance>();
const adapterStore = new Map<string, AdapterInstance>();

/**
 * Retrieves or creates a signer instance based on the arguments.
 * Handles both custom signers (hardware wallets) and regular signers.
 */
async function getSigner(args: CreateAdapterArgs): Promise<SignerInstance> {
    // Handle custom signers (hardware wallets) that live in Kotlin
    if (args.isCustom && args.publicKey) {
        return {
            sign: async (bytes: Iterable<number>): Promise<Hex> => {
                return await signWithCustomSigner(args.signerId, Uint8Array.from(bytes));
            },
            publicKey: args.publicKey as Hex,
        };
    }

    // Handle regular signers stored in JavaScript
    const storedSigner = signerStore.get(args.signerId);
    if (!storedSigner) {
        throw new Error(`Signer not found: ${args.signerId}`);
    }
    return storedSigner;
}

/**
 * Creates a signer from mnemonic or secret key.
 * Returns raw signer object - Kotlin generates signerId and extracts publicKey.
 */
export async function createSigner(args: CreateSignerArgs) {
    return callBridge('createSigner', async () => {
        let signer: SignerInstance;

        if (args.mnemonic && args.mnemonic.length > 0) {
            signer = (await Signer!.fromMnemonic(args.mnemonic, {
                type: args.mnemonicType || 'ton',
            })) as SignerInstance;
        } else if (args.secretKey) {
            signer = (await Signer!.fromPrivateKey(args.secretKey)) as SignerInstance;
        } else {
            throw new Error('Either mnemonic or secretKey must be provided');
        }

        // Store signer with temp ID for Kotlin to retrieve
        const tempId = `signer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        signerStore.set(tempId, signer);

        return { _tempId: tempId, signer };
    });
}

/**
 * Creates a wallet adapter from a signer.
 * Supports both regular signers (from mnemonic/secretKey) and custom signers (hardware wallets).
 * Returns raw adapter object - Kotlin generates adapterId and extracts address.
 */
export async function createAdapter(args: CreateAdapterArgs) {
    return callBridge('createAdapter', async () => {
        const signer = await getSigner(args);
        const network = args.network === 'mainnet' ? CHAIN.MAINNET : CHAIN.TESTNET;

        const workchain = args.workchain !== undefined ? args.workchain : 0;
        const walletId = args.walletId !== undefined ? args.walletId : undefined;

        let adapter: AdapterInstance;
        if (args.walletVersion === 'v5r1') {
            adapter = (await WalletV5R1Adapter!.create(signer, {
                client: walletKit.getApiClient(),
                network,
                workchain,
                ...(walletId !== undefined && { walletId }),
            })) as AdapterInstance;
        } else if (args.walletVersion === 'v4r2') {
            adapter = (await WalletV4R2Adapter!.create(signer, {
                client: walletKit.getApiClient(),
                network,
                workchain,
                ...(walletId !== undefined && { walletId }),
            })) as AdapterInstance;
        } else {
            throw new Error(`Unsupported wallet version: ${args.walletVersion}`);
        }

        // Store adapter with temp ID for Kotlin to retrieve
        const tempId = `adapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        adapterStore.set(tempId, adapter);

        return { _tempId: tempId, adapter };
    });
}

/**
 * Adds a wallet to WalletKit using an adapter.
 * Returns raw wallet object - Kotlin extracts address and publicKey.
 */
export async function addWallet(args: AddWalletArgs) {
    return callBridge('addWallet', async () => {
        const adapter = adapterStore.get(args.adapterId);
        if (!adapter) {
            throw new Error(`Adapter not found: ${args.adapterId}`);
        }

        const wallet = (await walletKit.addWallet(adapter)) as WalletKitWallet | null;

        if (!wallet) {
            throw new Error('Failed to add wallet - may already exist');
        }

        // Clean up the adapter from store after use
        adapterStore.delete(args.adapterId);

        return wallet;
    });
}
