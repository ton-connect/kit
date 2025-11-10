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
    RemoveWalletArgs,
    GetWalletStateArgs,
    CallContext,
    WalletDescriptor,
    CreateSignerArgs,
    CreateAdapterArgs,
    AddWalletArgs,
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
 * Get a single wallet by address.
 *
 * @param args - Wallet address to find.
 * @param context - Diagnostic context for tracing.
 */
export async function getWallet(args: { address: string }, context?: CallContext): Promise<WalletDescriptor | null> {
    emitCallCheckpoint(context, 'getWallet:enter');
    requireWalletKit();
    emitCallCheckpoint(context, 'getWallet:after-requireWalletKit');
    if (typeof walletKit.ensureInitialized === 'function') {
        emitCallCheckpoint(context, 'getWallet:before-walletKit.ensureInitialized');
        await walletKit.ensureInitialized();
        emitCallCheckpoint(context, 'getWallet:after-walletKit.ensureInitialized');
    }
    
    const address = args.address?.trim();
    if (!address) {
        throw new Error('Wallet address is required');
    }
    
    const wallet = walletKit.getWallet?.(address);
    if (!wallet) {
        return null;
    }
    
    emitCallCheckpoint(context, 'getWallet:after-walletKit.getWallet');
    return {
        address: wallet.getAddress(),
        publicKey: Array.from(wallet.publicKey as Uint8Array)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join(''),
        version: typeof wallet.version === 'string' ? wallet.version : 'unknown',
        index: 0, // Single wallet doesn't have index
        network: currentNetwork,
    };
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

// Store for signers and adapters
const signerStore = new Map<string, any>();
const adapterStore = new Map<string, any>();

/**
 * Creates a signer from mnemonic or secret key.
 * This matches the step 1 in the JS WalletKit docs pattern.
 *
 * @param args - Mnemonic or secret key with optional type
 * @param context - Diagnostic context for tracing
 * @returns Signer ID and public key
 */
export async function createSigner(args: CreateSignerArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'createSigner:start');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'createSigner:after-ensureWalletKitLoaded');

    let signer: any;
    
    if (args.mnemonic && args.mnemonic.length > 0) {
        // Create from mnemonic
        signer = await Signer.fromMnemonic(args.mnemonic, { type: args.mnemonicType || 'ton' });
    } else if (args.secretKey) {
        // Create from secret key
        signer = await Signer.fromPrivateKey(args.secretKey);
    } else {
        throw new Error('Either mnemonic or secretKey must be provided');
    }

    // Generate a unique ID for this signer
    const signerId = `signer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    signerStore.set(signerId, signer);

    emitCallCheckpoint(context, 'createSigner:complete');
    return {
        signerId,
        publicKey: signer.publicKey.replace(/^0x/, ''),
    };
}

/**
 * Creates a wallet adapter from a signer.
 * This matches the step 2 in the JS WalletKit docs pattern.
 *
 * @param args - Signer ID and wallet version
 * @param context - Diagnostic context for tracing
 * @returns Adapter ID and wallet address
 */
export async function createAdapter(args: CreateAdapterArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'createAdapter:start');
    await ensureWalletKitLoaded();
    requireWalletKit();
    emitCallCheckpoint(context, 'createAdapter:after-requireWalletKit');

    const signer = signerStore.get(args.signerId);
    if (!signer) {
        throw new Error(`Signer not found: ${args.signerId}`);
    }

    const { chain } = resolveChain(args.network as string | undefined);

    // Extract workchain and walletId from args, with defaults
    const workchain = args.workchain !== undefined ? args.workchain : 0;
    const walletId = args.walletId !== undefined ? args.walletId : undefined;

    let adapter: any;
    if (args.walletVersion === 'v5r1') {
        adapter = await WalletV5R1Adapter.create(signer, {
            client: walletKit.getApiClient(),
            network: chain,
            workchain,
            ...(walletId !== undefined && { walletId }),
        });
    } else if (args.walletVersion === 'v4r2') {
        adapter = await WalletV4R2Adapter.create(signer, {
            client: walletKit.getApiClient(),
            network: chain,
            workchain,
            ...(walletId !== undefined && { walletId }),
        });
    } else {
        throw new Error(`Unsupported wallet version: ${args.walletVersion}`);
    }

    // Generate a unique ID for this adapter
    const adapterId = `adapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    adapterStore.set(adapterId, adapter);

    emitCallCheckpoint(context, 'createAdapter:complete');
    return {
        adapterId,
        address: adapter.getAddress(),
    };
}

/**
 * Adds a wallet to the WalletKit using an adapter.
 * This matches the step 3 in the JS WalletKit docs pattern.
 *
 * @param args - Adapter ID
 * @param context - Diagnostic context for tracing
 * @returns Wallet address and public key
 */
export async function addWallet(args: AddWalletArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'addWallet:start');
    await ensureWalletKitLoaded();
    requireWalletKit();
    emitCallCheckpoint(context, 'addWallet:after-requireWalletKit');

    const adapter = adapterStore.get(args.adapterId);
    if (!adapter) {
        throw new Error(`Adapter not found: ${args.adapterId}`);
    }

    emitCallCheckpoint(context, 'addWallet:before-walletKit.addWallet');
    const wallet = await walletKit.addWallet(adapter);
    emitCallCheckpoint(context, 'addWallet:after-walletKit.addWallet');

    if (!wallet) {
        throw new Error('Failed to add wallet - may already exist');
    }

    // Clean up the adapter from store after use
    adapterStore.delete(args.adapterId);

    return {
        address: wallet.getAddress(),
        publicKey: Array.from(wallet.publicKey as Uint8Array)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join(''),
    };
}
