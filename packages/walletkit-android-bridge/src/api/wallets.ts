/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Wallet management operations.
 */

import type { Hex, Network, WalletAdapter, ApiClient, Base64String, UserFriendlyAddress } from '@ton/walletkit';
import type { WalletId } from '@ton/walletkit';
import type { TransactionRequest } from '@ton/walletkit';
import type { PreparedSignData } from '@ton/walletkit';
import type { ProofMessage } from '@ton/walletkit';

import { Signer, WalletV4R2Adapter, WalletV5R1Adapter } from '../core/moduleLoader';
import { kit, wallet, getKit } from '../utils/bridge';
import { retain, retainWithId, get, release } from '../utils/registry';

/**
 * Lists all wallets.
 */
export async function getWallets() {
    const wallets = (await kit('getWallets')) as { getWalletId?: () => string }[];
    return wallets.map((w) => ({ walletId: w.getWalletId?.(), wallet: w }));
}

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

export async function createSignerFromMnemonic(args: { mnemonic: string[]; mnemonicType?: string }) {
    const signer = await Signer!.fromMnemonic(args.mnemonic, { type: args.mnemonicType ?? 'ton' });
    const signerId = retain('signer', signer);
    return { signerId, publicKey: signer.publicKey };
}

export async function createSignerFromPrivateKey(args: { secretKey: string }) {
    const signer = await Signer!.fromPrivateKey(args.secretKey);
    const signerId = retain('signer', signer);
    return { signerId, publicKey: signer.publicKey };
}

export async function createSignerFromCustom(args: { signerId: string; publicKey: string }) {
    const { signerId, publicKey } = args;
    const proxySigner = {
        publicKey: publicKey as Hex,
        sign: async (bytes: Iterable<number>): Promise<Hex> => {
            const result = await window.WalletKitNative?.signWithCustomSigner?.(signerId, Array.from(bytes));
            if (!result) throw new Error('signWithCustomSigner not available');
            return result as Hex;
        },
    };
    retainWithId(signerId, proxySigner);
    return { signerId, publicKey };
}

export async function createV5R1WalletAdapter(args: {
    signerId: string;
    network: { chainId: string };
    workchain?: number;
    walletId?: number;
}) {
    const instance = await getKit();
    const signer = get<{ publicKey: Hex; sign: (data: Iterable<number>) => Promise<Hex> }>(args.signerId);
    if (!signer) throw new Error(`Signer not found in registry: ${args.signerId}`);

    const network = args.network as unknown as Network;
    const adapter = await WalletV5R1Adapter!.create(signer, {
        client: instance.getApiClient(network),
        network,
        workchain: args.workchain ?? 0,
        walletId: args.walletId,
    });

    const adapterId = retain('adapter', adapter);
    return { adapterId, address: adapter.getAddress() };
}

export async function createV4R2WalletAdapter(args: {
    signerId: string;
    network: { chainId: string };
    workchain?: number;
    walletId?: number;
}) {
    const instance = await getKit();
    const signer = get<{ publicKey: Hex; sign: (data: Iterable<number>) => Promise<Hex> }>(args.signerId);
    if (!signer) throw new Error(`Signer not found in registry: ${args.signerId}`);

    const network = args.network as unknown as Network;
    const adapter = await WalletV4R2Adapter!.create(signer, {
        client: instance.getApiClient(network),
        network,
        workchain: args.workchain ?? 0,
        walletId: args.walletId,
    });

    const adapterId = retain('adapter', adapter);
    return { adapterId, address: adapter.getAddress() };
}

export async function addWallet(args: {
    adapterId: string;
    walletId?: string;
    publicKey?: string;
    network?: { chainId: string };
    address?: string;
}) {
    const instance = await getKit();

    if (args.publicKey) {
        const { adapterId, walletId, publicKey, address } = args;
        const network = args.network as unknown as Network;

        const proxyAdapter: WalletAdapter = {
            getPublicKey(): Hex {
                return publicKey as Hex;
            },
            getNetwork(): Network {
                return network;
            },
            getClient(): ApiClient {
                return instance.getApiClient(network);
            },
            getAddress(): UserFriendlyAddress {
                return address as UserFriendlyAddress;
            },
            getWalletId(): WalletId {
                return walletId as WalletId;
            },
            async getStateInit(): Promise<Base64String> {
                const result = await window.WalletKitNative?.adapterGetStateInit?.(adapterId);
                if (!result) throw new Error('adapterGetStateInit not available');
                return result as Base64String;
            },
            async getSignedSendTransaction(
                input: TransactionRequest,
                options?: { fakeSignature: boolean },
            ): Promise<Base64String> {
                const result = await window.WalletKitNative?.adapterSignTransaction?.(
                    adapterId,
                    JSON.stringify(input),
                    options?.fakeSignature ?? false,
                );
                if (!result) throw new Error('adapterSignTransaction not available');
                return result as Base64String;
            },
            async getSignedSignData(input: PreparedSignData, options?: { fakeSignature: boolean }): Promise<Hex> {
                const result = await window.WalletKitNative?.adapterSignData?.(
                    adapterId,
                    JSON.stringify(input),
                    options?.fakeSignature ?? false,
                );
                if (!result) throw new Error('adapterSignData not available');
                return result as Hex;
            },
            async getSignedTonProof(input: ProofMessage, options?: { fakeSignature: boolean }): Promise<Hex> {
                const result = await window.WalletKitNative?.adapterSignTonProof?.(
                    adapterId,
                    JSON.stringify(input),
                    options?.fakeSignature ?? false,
                );
                if (!result) throw new Error('adapterSignTonProof not available');
                return result as Hex;
            },
        };

        const w = await instance.addWallet(proxyAdapter as Parameters<typeof instance.addWallet>[0]);
        if (!w) return null;
        return { walletId: w.getWalletId?.(), wallet: w };
    }

    const adapter = get<WalletAdapter>(args.adapterId);
    if (!adapter) throw new Error(`Adapter not found in registry: ${args.adapterId}`);
    release(args.adapterId);

    const w = await instance.addWallet(adapter as Parameters<typeof instance.addWallet>[0]);
    if (!w) return null;
    return { walletId: w.getWalletId?.(), wallet: w };
}

export function releaseRef(args: { id: string }) {
    release(args.id);
    return { ok: true };
}
