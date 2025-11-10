/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Wallet management helpers covering creation, listing, and state retrieval.
 */
import type {
    CreateWalletWithSignerArgs,
    CreateWalletUsingMnemonicArgs,
    CreateWalletUsingSecretKeyArgs,
    RemoveWalletArgs,
    GetWalletStateArgs,
    CallContext,
    WalletDescriptor,
} from '../types';
import {
    ensureWalletKitLoaded,
    Signer,
    WalletV4R2Adapter,
    WalletV5R1Adapter,
    tonConnectChain,
    CHAIN,
} from '../core/moduleLoader';
import { walletKit, currentNetwork } from '../core/state';
import { requireWalletKit } from '../core/initialization';
import { emitCallCheckpoint } from '../transport/diagnostics';
import { normalizeNetworkValue } from '../utils/network';
import { registerSignerRequest, emitSignerRequest } from './cryptography';

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
 * Creates a V4R2 wallet backed by an external signer managed on the native side.
 *
 * @param args - Signer metadata and optional network override.
 * @param context - Diagnostic context for tracing.
 */
export async function createV4R2WalletWithSigner(args: CreateWalletWithSignerArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'createV4R2WalletWithSigner:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'createV4R2WalletWithSigner:after-ensureWalletKitLoaded');
    requireWalletKit();
    emitCallCheckpoint(context, 'createV4R2WalletWithSigner:after-requireWalletKit');

    const { chain } = resolveChain(args.network as string | undefined);

    const pendingSignRequests = new Map<string, { resolve: (sig: Uint8Array) => void; reject: (err: Error) => void }>();
    registerSignerRequest(args.signerId, pendingSignRequests);

    const publicKeyHex = args.publicKey.startsWith('0x') ? args.publicKey : `0x${args.publicKey}`;

    const customSigner: any = {
        sign: async (bytes: Uint8Array) => {
            const requestId = `sign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            emitSignerRequest(args.signerId, requestId, bytes);
            return new Promise<Uint8Array>((resolve, reject) => {
                pendingSignRequests.set(requestId, { resolve, reject });
                setTimeout(() => {
                    if (pendingSignRequests.has(requestId)) {
                        pendingSignRequests.delete(requestId);
                        reject(new Error('Sign request timed out'));
                    }
                }, 60000);
            });
        },
        publicKey: publicKeyHex,
    };

    emitCallCheckpoint(context, 'createV4R2WalletWithSigner:before-createWalletAdapter');
    const walletAdapter = await WalletV4R2Adapter.create(customSigner, {
        client: walletKit.getApiClient(),
        network: chain,
    });

    emitCallCheckpoint(context, 'createV4R2WalletWithSigner:after-createWalletAdapter');
    emitCallCheckpoint(context, 'createV4R2WalletWithSigner:before-walletKit.addWallet');
    const wallet = await walletKit.addWallet(walletAdapter);
    emitCallCheckpoint(context, 'createV4R2WalletWithSigner:after-walletKit.addWallet');

    if (!wallet) {
        throw new Error('Failed to add wallet - may already exist');
    }

    return {
        address: wallet.getAddress(),
        publicKey: args.publicKey.replace(/^0x/, ''),
    };
}

/**
 * Creates a V5R1 wallet backed by an external signer managed on the native side.
 *
 * @param args - Signer metadata and optional network override.
 * @param context - Diagnostic context for tracing.
 */
export async function createV5R1WalletWithSigner(args: CreateWalletWithSignerArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'createV5R1WalletWithSigner:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'createV5R1WalletWithSigner:after-ensureWalletKitLoaded');
    requireWalletKit();
    emitCallCheckpoint(context, 'createV5R1WalletWithSigner:after-requireWalletKit');

    const { chain } = resolveChain(args.network as string | undefined);

    const pendingSignRequests = new Map<string, { resolve: (sig: Uint8Array) => void; reject: (err: Error) => void }>();
    registerSignerRequest(args.signerId, pendingSignRequests);

    const publicKeyHex = args.publicKey.startsWith('0x') ? args.publicKey : `0x${args.publicKey}`;

    const customSigner: any = {
        sign: async (bytes: Uint8Array) => {
            const requestId = `sign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            emitSignerRequest(args.signerId, requestId, bytes);
            return new Promise<Uint8Array>((resolve, reject) => {
                pendingSignRequests.set(requestId, { resolve, reject });
                setTimeout(() => {
                    if (pendingSignRequests.has(requestId)) {
                        pendingSignRequests.delete(requestId);
                        reject(new Error('Sign request timed out'));
                    }
                }, 60000);
            });
        },
        publicKey: publicKeyHex,
    };

    emitCallCheckpoint(context, 'createV5R1WalletWithSigner:before-createWalletAdapter');
    const walletAdapter = await WalletV5R1Adapter.create(customSigner, {
        client: walletKit.getApiClient(),
        network: chain,
    });

    emitCallCheckpoint(context, 'createV5R1WalletWithSigner:after-createWalletAdapter');
    emitCallCheckpoint(context, 'createV5R1WalletWithSigner:before-walletKit.addWallet');
    const wallet = await walletKit.addWallet(walletAdapter);
    emitCallCheckpoint(context, 'createV5R1WalletWithSigner:after-walletKit.addWallet');

    if (!wallet) {
        throw new Error('Failed to add wallet - may already exist');
    }

    return {
        address: wallet.getAddress(),
        publicKey: args.publicKey.replace(/^0x/, ''),
    };
}

async function createWalletUsingMnemonic(
    args: CreateWalletUsingMnemonicArgs,
    adapterFactory: typeof WalletV4R2Adapter | typeof WalletV5R1Adapter,
    context: CallContext | undefined,
) {
    emitCallCheckpoint(context, 'createWalletUsingMnemonic:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'createWalletUsingMnemonic:after-ensureWalletKitLoaded');
    requireWalletKit();
    if (!args.mnemonic) {
        throw new Error('Mnemonic required for mnemonic wallet type');
    }

    const { chain } = resolveChain(args.network as string | undefined);
    const signer = await Signer.fromMnemonic(args.mnemonic, { type: 'ton' });
    const adapter = await adapterFactory.create(signer, {
        client: walletKit.getApiClient(),
        network: chain,
    });

    const wallet = await walletKit.addWallet(adapter);
    if (!wallet) {
        throw new Error('Failed to add wallet - may already exist');
    }

    return {
        address: wallet.getAddress(),
        publicKey: signer.publicKey.replace('0x', ''),
    };
}

async function createWalletUsingSecretKey(
    args: CreateWalletUsingSecretKeyArgs,
    adapterFactory: typeof WalletV4R2Adapter | typeof WalletV5R1Adapter,
    context: CallContext | undefined,
) {
    emitCallCheckpoint(context, 'createWalletUsingSecretKey:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'createWalletUsingSecretKey:after-ensureWalletKitLoaded');
    requireWalletKit();
    if (!args.secretKey) {
        throw new Error('Secret key required for secret key wallet type');
    }

    const { chain } = resolveChain(args.network as string | undefined);
    const signer = await Signer.fromPrivateKey(args.secretKey);
    const adapter = await adapterFactory.create(signer, {
        client: walletKit.getApiClient(),
        network: chain,
    });

    const wallet = await walletKit.addWallet(adapter);
    if (!wallet) {
        throw new Error('Failed to add wallet - may already exist');
    }

    return {
        address: wallet.getAddress(),
        publicKey: signer.publicKey.replace('0x', ''),
    };
}

/**
 * Creates a V4R2 wallet using a mnemonic phrase.
 *
 * @param args - Mnemonic words and optional network override.
 * @param context - Diagnostic context for tracing.
 */
export async function createV4R2WalletUsingMnemonic(args: CreateWalletUsingMnemonicArgs, context?: CallContext) {
    return createWalletUsingMnemonic(args, WalletV4R2Adapter, context);
}

/**
 * Creates a V4R2 wallet using a raw secret key.
 *
 * @param args - Secret key and optional network override.
 * @param context - Diagnostic context for tracing.
 */
export async function createV4R2WalletUsingSecretKey(args: CreateWalletUsingSecretKeyArgs, context?: CallContext) {
    return createWalletUsingSecretKey(args, WalletV4R2Adapter, context);
}

/**
 * Creates a V5R1 wallet using a mnemonic phrase.
 *
 * @param args - Mnemonic words and optional network override.
 * @param context - Diagnostic context for tracing.
 */
export async function createV5R1WalletUsingMnemonic(args: CreateWalletUsingMnemonicArgs, context?: CallContext) {
    return createWalletUsingMnemonic(args, WalletV5R1Adapter, context);
}

/**
 * Creates a V5R1 wallet using a raw secret key.
 *
 * @param args - Secret key and optional network override.
 * @param context - Diagnostic context for tracing.
 */
export async function createV5R1WalletUsingSecretKey(args: CreateWalletUsingSecretKeyArgs, context?: CallContext) {
    return createWalletUsingSecretKey(args, WalletV5R1Adapter, context);
}

/**
 * Lists all wallets known to WalletKit along with metadata required by the native layer.
 *
 * @param _args - Unused placeholder to preserve compatibility.
 * @param context - Diagnostic context for tracing.
 */
export async function getWallets(_?: unknown, context?: CallContext): Promise<WalletDescriptor[]> {
    emitCallCheckpoint(context, 'getWallets:enter');
    requireWalletKit();
    emitCallCheckpoint(context, 'getWallets:after-requireWalletKit');
    if (typeof walletKit.ensureInitialized === 'function') {
        emitCallCheckpoint(context, 'getWallets:before-walletKit.ensureInitialized');
        await walletKit.ensureInitialized();
        emitCallCheckpoint(context, 'getWallets:after-walletKit.ensureInitialized');
    }
    const wallets = walletKit.getWallets?.() || [];
    emitCallCheckpoint(context, 'getWallets:after-walletKit.getWallets');
    return wallets.map((wallet: any, index: number) => ({
        address: wallet.getAddress(),
        publicKey: Array.from(wallet.publicKey as Uint8Array)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join(''),
        version: typeof wallet.version === 'string' ? wallet.version : 'unknown',
        index,
        network: currentNetwork,
    }));
}

/**
 * Removes a wallet from WalletKit's storage.
 *
 * @param args - Target wallet address.
 * @param context - Diagnostic context for tracing.
 */
export async function removeWallet(args: RemoveWalletArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'removeWallet:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'removeWallet:after-ensureWalletKitLoaded');
    requireWalletKit();
    const address = args.address?.trim();
    if (!address) {
        throw new Error('Wallet address is required');
    }
    const wallet = walletKit.getWallet?.(address);
    if (!wallet) {
        return { removed: false };
    }
    emitCallCheckpoint(context, 'removeWallet:before-walletKit.removeWallet');
    await walletKit.removeWallet(address);
    emitCallCheckpoint(context, 'removeWallet:after-walletKit.removeWallet');
    return { removed: true };
}

/**
 * Fetches the current balance and cached transactions for a wallet.
 *
 * @param args - Wallet address to inspect.
 * @param context - Diagnostic context for tracing.
 */
export async function getWalletState(args: GetWalletStateArgs, context?: CallContext) {
    requireWalletKit();
    if (typeof walletKit.ensureInitialized === 'function') {
        emitCallCheckpoint(context, 'getWalletState:before-walletKit.ensureInitialized');
        await walletKit.ensureInitialized();
        emitCallCheckpoint(context, 'getWalletState:after-walletKit.ensureInitialized');
    }
    const wallet = walletKit.getWallet(args.address);
    if (!wallet) throw new Error('Wallet not found');
    emitCallCheckpoint(context, 'getWalletState:before-wallet.getBalance');
    const balance = await wallet.getBalance();
    emitCallCheckpoint(context, 'getWalletState:after-wallet.getBalance');
    const balanceStr = balance != null && typeof balance.toString === 'function' ? balance.toString() : String(balance);
    const transactions = wallet.getTransactions ? await wallet.getTransactions(10) : [];
    emitCallCheckpoint(context, 'getWalletState:after-wallet.getTransactions');
    return { balance: balanceStr, transactions };
}
