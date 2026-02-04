/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * bridge.ts - Minimal unified bridge for all operations
 *
 * Single entry point for calling WalletKit, Wallet, and Client methods.
 * Handles initialization, wallet lookup, and error handling in one place.
 */

import type { Wallet } from '@ton/walletkit';

import type { WalletKitInstance } from '../core/state';
import { walletKit } from '../core/state';

// Re-export for external use
export type { WalletKitInstance };

/**
 * Ensures WalletKit is initialized and ready.
 */
async function ensureReady(): Promise<WalletKitInstance> {
    if (!walletKit) {
        throw new Error('WalletKit not initialized');
    }
    await walletKit.ensureInitialized?.();
    return walletKit;
}

/**
 * Gets a wallet by ID, throwing if not found.
 */
function getWalletOrThrow(kit: WalletKitInstance, walletId: string): Wallet {
    const wallet = kit.getWallet(walletId);
    if (!wallet) {
        throw new Error(`Wallet not found: ${walletId}`);
    }
    return wallet;
}

/**
 * Calls a method on WalletKit instance.
 *
 * @example
 * await kit('removeWallet', walletId);
 * await kit('handleTonConnectUrl', url);
 * await kit('listSessions');
 */
export async function kit<M extends keyof WalletKitInstance>(
    method: M,
    ...args: unknown[]
): Promise<unknown> {
    const instance = await ensureReady();
    const fn = instance[method];
    if (typeof fn !== 'function') {
        throw new Error(`Method '${method}' not found on WalletKit`);
    }
    return (fn as (...a: unknown[]) => unknown).apply(instance, args);
}

/**
 * Calls a method on a Wallet instance.
 *
 * @example
 * await wallet(walletId, 'getBalance');
 * await wallet(walletId, 'getJettons', { pagination });
 * await wallet(walletId, 'createTransferTonTransaction', request);
 */
export async function wallet<M extends keyof Wallet>(
    walletId: string,
    method: M,
    ...args: unknown[]
): Promise<unknown> {
    const instance = await ensureReady();
    const w = getWalletOrThrow(instance, walletId);
    const fn = w[method];
    if (typeof fn !== 'function') {
        throw new Error(`Method '${method}' not found on Wallet`);
    }
    return (fn as (...a: unknown[]) => unknown).apply(w, args);
}

/**
 * Get the raw WalletKit instance (for complex operations).
 * Use sparingly - prefer kit(), wallet() for type safety.
 */
export async function getKit(): Promise<WalletKitInstance> {
    return ensureReady();
}

/**
 * Get a wallet instance (for complex operations).
 * Use sparingly - prefer wallet() for type safety.
 */
export async function getWallet(walletId: string): Promise<Wallet> {
    const instance = await ensureReady();
    return getWalletOrThrow(instance, walletId);
}

/**
 * Calls a method on a Wallet instance. Extracts walletId from args.walletId.
 */
export async function walletCall<T = unknown>(method: string, args: { walletId: string; [k: string]: unknown }): Promise<T> {
    const instance = await ensureReady();
    const w = getWalletOrThrow(instance, args.walletId);
    const fn = (w as unknown as Record<string, unknown>)[method];
    if (typeof fn !== 'function') {
        throw new Error(`Method '${method}' not found on Wallet`);
    }
    return (fn as (args?: unknown) => Promise<T>).call(w, args);
}

/**
 * Calls a method on a Wallet's ApiClient. Extracts walletId from args.walletId.
 */
export async function clientCall<T = unknown>(method: string, args: { walletId: string; [k: string]: unknown }): Promise<T> {
    const instance = await ensureReady();
    const w = getWalletOrThrow(instance, args.walletId);
    const apiClient = w.getClient();
    const fn = (apiClient as unknown as Record<string, unknown>)[method];
    if (typeof fn !== 'function') {
        throw new Error(`Method '${method}' not found on ApiClient`);
    }
    return (fn as (args?: unknown) => Promise<T>).call(apiClient, args);
}
