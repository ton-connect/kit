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

import type { Hex, Network, WalletAdapter } from '@ton/walletkit';

import { Signer, WalletV4R2Adapter, WalletV5R1Adapter } from '../core/moduleLoader';
import { kit, wallet, getKit } from '../utils/bridge';
import { signWithCustomSigner } from './cryptography';

type SignerInstance = { sign: (bytes: Iterable<number>) => Promise<Hex>; publicKey: Hex };

/**
 * Lists all wallets.
 */
export async function getWallets() {
    const wallets = await kit('getWallets') as { getWalletId?: () => string }[];
    return wallets.map((w) => ({ walletId: w.getWalletId?.(), wallet: w }));
}

/**
 * Get a single wallet by walletId.
 */
export async function getWalletById(args: { walletId: string }) {
    const w = await kit('getWallet', args.walletId);
    if (!w) return null;
    return { walletId: (w as { getWalletId?: () => string }).getWalletId?.(), wallet: w };
}

export async function getWalletAddress(args: { walletId: string }) {
    return wallet(args.walletId, 'getAddress');
}

export async function removeWallet(args: { walletId: string }) {
    return kit('removeWallet', args.walletId);
}

export async function getBalance(args: { walletId: string }) {
    return wallet(args.walletId, 'getBalance');
}

const signerStore = new Map<string, SignerInstance>();
const adapterStore = new Map<string, unknown>();

type CreateAdapterArgs = {
    signerId: string;
    isCustom?: boolean;
    publicKey?: string;
    walletVersion?: string;
    network: string;
    workchain: number;
    walletId?: string;
};

type CreateSignerArgs = {
    mnemonic?: string[];
    secretKey?: string;
    mnemonicType?: string;
};

type AddWalletArgs = {
    adapterId: string;
};

async function getSigner(args: CreateAdapterArgs): Promise<SignerInstance> {
    if (args.isCustom && args.publicKey) {
        return {
            sign: async (bytes: Iterable<number>): Promise<Hex> => {
                return await signWithCustomSigner(args.signerId, Uint8Array.from(bytes));
            },
            publicKey: args.publicKey as Hex,
        };
    }

    const storedSigner = signerStore.get(args.signerId);
    if (!storedSigner) {
        throw new Error(`Signer not found: ${args.signerId}`);
    }
    return storedSigner;
}

export async function createSigner(args: CreateSignerArgs) {
    if (!Signer) {
        throw new Error('Signer module not loaded');
    }
    if (!args.mnemonic?.length && !args.secretKey) {
        throw new Error('Either mnemonic or secretKey is required');
    }
    const signer =
        args.mnemonic && args.mnemonic.length > 0
            ? ((await Signer.fromMnemonic(args.mnemonic, { type: args.mnemonicType || 'ton' })) as SignerInstance)
            : ((await Signer.fromPrivateKey(args.secretKey as string)) as SignerInstance);

    const tempId = `signer_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    signerStore.set(tempId, signer);

    return { _tempId: tempId, signer };
}

export async function createAdapter(args: CreateAdapterArgs) {
    const instance = await getKit();
    const signer = await getSigner(args);
    const AdapterClass = args.walletVersion === 'v5r1' ? WalletV5R1Adapter : WalletV4R2Adapter;
    if (!AdapterClass) {
        throw new Error(`WalletAdapter module not loaded`);
    }
    const network = args.network as unknown as Network;
    const adapter = await AdapterClass.create(signer, {
        client: instance.getApiClient(network),
        network,
        workchain: args.workchain,
        walletId: args.walletId,
    });

    const tempId = `adapter_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    adapterStore.set(tempId, adapter);

    return { _tempId: tempId, adapter };
}

export async function getAdapterAddress(args: { adapterId: string }) {
    const adapter = adapterStore.get(args.adapterId) as WalletAdapter | undefined;
    if (!adapter) {
        throw new Error(`Adapter not found: ${args.adapterId}`);
    }
    return adapter.getAddress();
}

export async function addWallet(args: AddWalletArgs) {
    const instance = await getKit();
    const adapter = adapterStore.get(args.adapterId);
    if (!adapter) {
        throw new Error(`Adapter not found: ${args.adapterId}`);
    }

    const w = await instance.addWallet(adapter as Parameters<typeof instance.addWallet>[0]);
    adapterStore.delete(args.adapterId);

    if (!w) return null;
    return { walletId: w.getWalletId?.(), wallet: w };
}
