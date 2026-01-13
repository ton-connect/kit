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
 * Pure pass-through bridge - returns raw JS objects/proxies.
 * Kotlin is responsible for adapting to whatever JS returns.
 */

import type { Hex } from '@ton/walletkit';

import type {
    RemoveWalletArgs,
    GetBalanceArgs,
    CreateSignerArgs,
    CreateAdapterArgs,
    AddWalletArgs,
    WalletKitSigner,
    WalletKitAdapter,
} from '../types';
import { Signer, WalletV4R2Adapter, WalletV5R1Adapter } from '../core/moduleLoader';
import { callBridge } from '../utils/bridgeWrapper';
import { signWithCustomSigner } from './cryptography';

type SignerInstance = WalletKitSigner;
type AdapterInstance = WalletKitAdapter;

/**
 * Lists all wallets.
 * Returns walletId with each wallet since network can't be inferred from wallet properties.
 */
export async function getWallets() {
    return callBridge('getWallets', async (kit) => {
        const wallets = kit.getWallets?.() ?? [];
        // Include walletId since getNetwork()/getAddress() are methods that don't serialize
        return wallets.map((w) => ({
            walletId: w.getWalletId?.(),
            wallet: w,
        }));
    });
}

/**
 * Get a single wallet by walletId.
 * Returns walletId with wallet since network can't be inferred from wallet properties.
 */
export async function getWallet(args: { walletId: string }) {
    return callBridge('getWallet', async (kit) => {
        const w = kit.getWallet?.(args.walletId);
        if (!w) return null;
        return { walletId: w.getWalletId?.(), wallet: w };
    });
}

/**
 * Gets the address of a wallet.
 * Returns raw result - Kotlin adapts to the response.
 */
export async function getWalletAddress(args: { walletId: string }) {
    return callBridge('getWalletAddress', async (kit) => {
        const wallet = kit.getWallet?.(args.walletId);
        return wallet?.getAddress?.() ?? null;
    });
}

/**
 * Removes a wallet from storage.
 * Returns raw result - Kotlin adapts to the response.
 */
export async function removeWallet(args: RemoveWalletArgs) {
    return callBridge('removeWallet', async (kit) => {
        return await kit.removeWallet?.(args.walletId);
    });
}

/**
 * Fetches wallet balance.
 * Returns raw balance - Kotlin adapts to the response.
 */
export async function getBalance(args: GetBalanceArgs) {
    return callBridge('getBalance', async (kit) => {
        const wallet = kit.getWallet?.(args.walletId);
        return await wallet?.getBalance?.();
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
    return callBridge('createSigner', async (_kit) => {
        const signer =
            args.mnemonic && args.mnemonic.length > 0
                ? ((await Signer!.fromMnemonic(args.mnemonic, { type: args.mnemonicType || 'ton' })) as SignerInstance)
                : ((await Signer!.fromPrivateKey(args.secretKey!)) as SignerInstance);

        // Store signer with temp ID for Kotlin to retrieve
        const tempId = `signer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        signerStore.set(tempId, signer);

        return { _tempId: tempId, signer };
    });
}

/**
 * Creates a wallet adapter from a signer.
 * Supports both regular signers (from mnemonic/secretKey) and custom signers (hardware wallets).
 * Returns adapter ID - Kotlin is responsible for all mapping and transformation.
 */
export async function createAdapter(args: CreateAdapterArgs) {
    return callBridge('createAdapter', async (kit) => {
        const signer = await getSigner(args);
        const AdapterClass = args.walletVersion === 'v5r1' ? WalletV5R1Adapter : WalletV4R2Adapter;
        const adapter = (await AdapterClass!.create(signer, {
            client: kit.getApiClient(args.network),
            network: args.network,
            workchain: args.workchain,
            walletId: args.walletId,
        })) as AdapterInstance;

        // Store adapter with temp ID for Kotlin to retrieve
        const tempId = `adapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        adapterStore.set(tempId, adapter);

        // Return only the temp ID and the raw adapter object
        // Kotlin is responsible for extracting any needed properties
        return { _tempId: tempId, adapter };
    });
}
/**
 * Gets the address from a stored adapter.
 * Returns raw address - Kotlin adapts to the response.
 */
export async function getAdapterAddress(args: { adapterId: string }) {
    return callBridge('getAdapterAddress', async (_kit) => {
        const adapter = adapterStore.get(args.adapterId);
        if (!adapter) {
            throw new Error(`Adapter not found: ${args.adapterId}`);
        }
        return adapter.getAddress();
    });
}

/**
 * Adds a wallet to WalletKit using an adapter.
 * Returns walletId with wallet since getWalletId() is a method that doesn't serialize.
 */
export async function addWallet(args: AddWalletArgs) {
    return callBridge('addWallet', async (kit) => {
        const adapter = adapterStore.get(args.adapterId);
        if (!adapter) {
            throw new Error(`Adapter not found: ${args.adapterId}`);
        }

        const wallet = await kit.addWallet(adapter);

        // Clean up the adapter from store after use
        adapterStore.delete(args.adapterId);

        if (!wallet) return null;
        return { walletId: wallet.getWalletId?.(), wallet };
    });
}
