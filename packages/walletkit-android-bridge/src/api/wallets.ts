/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex, Network, WalletAdapter, ApiClient, Base64String, UserFriendlyAddress } from '@ton/walletkit';
import type { WalletId } from '@ton/walletkit';
import type { TransactionRequest } from '@ton/walletkit';
import type { PreparedSignData } from '@ton/walletkit';
import type { ProofMessage } from '@ton/walletkit';

import { Signer, WalletV4R2Adapter, WalletV5R1Adapter } from '../core/moduleLoader';
import { kit, wallet, getKit } from '../utils/bridge';
import { retain, retainWithId, get, release } from '../utils/registry';
import { bridgeRequest, bridgeRequestSync } from '../transport/nativeBridge';

// Wraps a Kotlin-side TONWalletAdapter. Sync getters call Kotlin synchronously
// via @JavascriptInterface; signing/stateInit delegate via async reverse-RPC.
class ProxyWalletAdapter implements WalletAdapter {
    constructor(
        private readonly adapterId: string,
        private readonly apiClientProvider: (network: Network) => ApiClient,
    ) {}

    getPublicKey(): Hex {
        return bridgeRequestSync('getPublicKey', { adapterId: this.adapterId }) as Hex;
    }

    getNetwork(): Network {
        const raw = bridgeRequestSync('getNetwork', { adapterId: this.adapterId });
        const parsed = JSON.parse(raw);
        return parsed as Network;
    }

    getClient(): ApiClient {
        return this.apiClientProvider(this.getNetwork());
    }

    getAddress(): UserFriendlyAddress {
        return bridgeRequestSync('getAddress', { adapterId: this.adapterId }) as UserFriendlyAddress;
    }

    getWalletId(): WalletId {
        return bridgeRequestSync('getWalletId', { adapterId: this.adapterId }) as WalletId;
    }

    async getStateInit(): Promise<Base64String> {
        const result = await bridgeRequest('adapterGetStateInit', { adapterId: this.adapterId });
        if (!result) throw new Error('adapterGetStateInit: no result from native');
        return result as Base64String;
    }

    async getSignedSendTransaction(
        input: TransactionRequest,
        options?: { fakeSignature: boolean },
    ): Promise<Base64String> {
        const result = await bridgeRequest('adapterSignTransaction', {
            adapterId: this.adapterId,
            input: JSON.stringify(input),
            fakeSignature: options?.fakeSignature ?? false,
        });
        if (!result) throw new Error('adapterSignTransaction: no result from native');
        return result as Base64String;
    }

    async getSignedSignData(input: PreparedSignData, options?: { fakeSignature: boolean }): Promise<Hex> {
        const result = await bridgeRequest('adapterSignData', {
            adapterId: this.adapterId,
            input: JSON.stringify(input),
            fakeSignature: options?.fakeSignature ?? false,
        });
        if (!result) throw new Error('adapterSignData: no result from native');
        return result as Hex;
    }

    async getSignedTonProof(input: ProofMessage, options?: { fakeSignature: boolean }): Promise<Hex> {
        const result = await bridgeRequest('adapterSignTonProof', {
            adapterId: this.adapterId,
            input: JSON.stringify(input),
            fakeSignature: options?.fakeSignature ?? false,
        });
        if (!result) throw new Error('adapterSignTonProof: no result from native');
        return result as Hex;
    }
}

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
    if (!Signer) throw new Error('Signer module not loaded');
    const signer = await Signer.fromMnemonic(args.mnemonic, { type: args.mnemonicType ?? 'ton' });
    const signerId = retain('signer', signer);
    return { signerId, publicKey: signer.publicKey };
}

export async function createSignerFromPrivateKey(args: { secretKey: string }) {
    if (!Signer) throw new Error('Signer module not loaded');
    const signer = await Signer.fromPrivateKey(args.secretKey);
    const signerId = retain('signer', signer);
    return { signerId, publicKey: signer.publicKey };
}

export async function createSignerFromCustom(args: { signerId: string; publicKey: string }) {
    const { signerId, publicKey } = args;
    const proxySigner = {
        publicKey: publicKey as Hex,
        sign: async (bytes: Iterable<number>): Promise<Hex> => {
            const result = await bridgeRequest('signWithCustomSigner', {
                signerId,
                data: Array.from(bytes),
            });
            if (!result) throw new Error('signWithCustomSigner: no result from native');
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
    if (!WalletV5R1Adapter) throw new Error('WalletV5R1Adapter module not loaded');
    const adapter = await WalletV5R1Adapter.create(signer, {
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
    if (!WalletV4R2Adapter) throw new Error('WalletV4R2Adapter module not loaded');
    const adapter = await WalletV4R2Adapter.create(signer, {
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
}) {
    const instance = await getKit();

    // Check if adapter exists in JS registry (BridgeWalletAdapter / JS-created adapter path)
    const existingAdapter = get<WalletAdapter>(args.adapterId);
    if (existingAdapter) {
        const w = await instance.addWallet(existingAdapter as Parameters<typeof instance.addWallet>[0]);
        if (!w) return null;
        return { walletId: w.getWalletId?.(), wallet: w };
    }

    // Kotlin-side adapter — create proxy that calls Kotlin synchronously for getters
    const proxyAdapter = new ProxyWalletAdapter(
        args.adapterId,
        (network) => instance.getApiClient(network),
    );

    const w = await instance.addWallet(proxyAdapter as Parameters<typeof instance.addWallet>[0]);
    if (!w) return null;
    return { walletId: w.getWalletId?.(), wallet: w };
}

/**
 * Releases a JS-side registry object (signer or adapter created by createV5R1/createV4R2).
 */
export function releaseRef(args: { id: string }) {
    release(args.id);
    return { ok: true };
}
