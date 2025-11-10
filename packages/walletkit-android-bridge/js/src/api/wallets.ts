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

import type {
    RemoveWalletArgs,
    GetBalanceArgs,
    WalletDescriptor,
    CreateSignerArgs,
    CreateAdapterArgs,
    AddWalletArgs,
    WalletKitWallet,
    WalletKitAdapter,
    WalletKitSigner,
} from '../types';
import { Signer, WalletV4R2Adapter, WalletV5R1Adapter, tonConnectChain, CHAIN } from '../core/moduleLoader';
import { walletKit, currentNetwork } from '../core/state';
import { normalizeNetworkValue } from '../utils/network';
import { callBridge } from '../utils/bridgeWrapper';

type SignerInstance = WalletKitSigner;
type AdapterInstance = WalletKitAdapter;

function requireModule<T>(moduleRef: T | null, name: string): T {
    if (!moduleRef) {
        throw new Error(`${name} module is not available`);
    }
    return moduleRef;
}

function resolveChain(network?: string) {
    const chains = tonConnectChain;
    if (!chains || !CHAIN) {
        throw new Error('TON Connect chain constants unavailable');
    }
    const networkValue = normalizeNetworkValue(network, CHAIN);
    const isMainnet = networkValue === CHAIN.MAINNET;
    return {
        chain: isMainnet ? chains.MAINNET : chains.TESTNET,
        isMainnet,
    };
}

/**
 * Lists all wallets with metadata.
 */
export async function getWallets(): Promise<WalletDescriptor[]> {
    return callBridge('getWallets', async () => {
        const wallets = (walletKit.getWallets?.() ?? []) as WalletKitWallet[];

        // PublicKey formatting handled by Kotlin
        return wallets.map((wallet, index) => ({
            address: wallet.getAddress(),
            publicKey: wallet.publicKey,
            version: typeof wallet.version === 'string' ? wallet.version : 'unknown',
            index,
            network: currentNetwork,
        }));
    });
}

/**
 * Get a single wallet by address.
 */
export async function getWallet(args: { address: string }): Promise<WalletDescriptor | null> {
    return callBridge('getWallet', async () => {
        if (!args.address) {
            throw new Error('Wallet address is required');
        }

        const wallet = walletKit.getWallet?.(args.address) as WalletKitWallet | undefined;
        if (!wallet) {
            return null;
        }

        // PublicKey formatting handled by Kotlin
        return {
            address: wallet.getAddress(),
            publicKey: wallet.publicKey,
            version: typeof wallet.version === 'string' ? wallet.version : 'unknown',
            index: 0,
            network: currentNetwork,
        };
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
 * Fetches wallet balance and cached transactions.
 */
export async function getBalance(args: GetBalanceArgs) {
    return callBridge('getBalance', async () => {
        const wallet = walletKit.getWallet(args.address) as WalletKitWallet | undefined;
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        // Balance formatting handled by Kotlin
        const balance = await wallet.getBalance();
        const balanceStr = String(balance ?? '0');

        return { balance: balanceStr };
    });
}

// Store for signers and adapters
const signerStore = new Map<string, SignerInstance>();
const adapterStore = new Map<string, AdapterInstance>();

/**
 * Creates a signer from mnemonic or secret key.
 */
export async function createSigner(args: CreateSignerArgs) {
    return callBridge('createSigner', async () => {
        let signer: SignerInstance;
        const signerFactory = requireModule(Signer, 'Signer');

        if (args.mnemonic && args.mnemonic.length > 0) {
            signer = (await signerFactory.fromMnemonic(args.mnemonic, {
                type: args.mnemonicType || 'ton',
            })) as SignerInstance;
        } else if (args.secretKey) {
            signer = (await signerFactory.fromPrivateKey(args.secretKey)) as SignerInstance;
        } else {
            throw new Error('Either mnemonic or secretKey must be provided');
        }

        // ID generation and publicKey formatting handled by Kotlin
        const signerId = `signer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        signerStore.set(signerId, signer);

        return {
            signerId,
            publicKey: signer.publicKey,
        };
    });
}

/**
 * Creates a wallet adapter from a signer.
 */
export async function createAdapter(args: CreateAdapterArgs) {
    return callBridge('createAdapter', async () => {
        const signer = signerStore.get(args.signerId);
        if (!signer) {
            throw new Error(`Signer not found: ${args.signerId}`);
        }

        const { chain } = resolveChain(args.network as string | undefined);

        const workchain = args.workchain !== undefined ? args.workchain : 0;
        const walletId = args.walletId !== undefined ? args.walletId : undefined;

        let adapter: AdapterInstance;
        if (args.walletVersion === 'v5r1') {
            const factory = requireModule(WalletV5R1Adapter, 'WalletV5R1Adapter');
            adapter = (await factory.create(signer, {
                client: walletKit.getApiClient(),
                network: chain,
                workchain,
                ...(walletId !== undefined && { walletId }),
            })) as AdapterInstance;
        } else if (args.walletVersion === 'v4r2') {
            const factory = requireModule(WalletV4R2Adapter, 'WalletV4R2Adapter');
            adapter = (await factory.create(signer, {
                client: walletKit.getApiClient(),
                network: chain,
                workchain,
                ...(walletId !== undefined && { walletId }),
            })) as AdapterInstance;
        } else {
            throw new Error(`Unsupported wallet version: ${args.walletVersion}`);
        }

        // ID generation handled by Kotlin
        const adapterId = `adapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        adapterStore.set(adapterId, adapter);

        return {
            adapterId,
            address: adapter.getAddress(),
        };
    });
}

/**
 * Adds a wallet to WalletKit using an adapter.
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

        // PublicKey formatting handled by Kotlin
        return {
            address: wallet.getAddress(),
            publicKey: wallet.publicKey,
        };
    });
}
