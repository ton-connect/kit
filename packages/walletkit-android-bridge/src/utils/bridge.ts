/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Unified bridge for calling WalletKit, Wallet, and Client methods.
 */

import type { Wallet } from '@ton/walletkit';

import type { WalletKitInstance } from '../core/state';
import { walletKit } from '../core/state';

async function ensureReady(): Promise<WalletKitInstance> {
    if (!walletKit) {
        throw new Error('WalletKit not initialized');
    }
    await walletKit.ensureInitialized?.();
    return walletKit;
}

function getWalletOrThrow(kit: WalletKitInstance, walletId: string): Wallet {
    const wallet = kit.getWallet(walletId);
    if (!wallet) {
        throw new Error(`Wallet not found: ${walletId}`);
    }
    return wallet;
}

export async function kit<M extends keyof WalletKitInstance>(method: M, ...args: unknown[]): Promise<unknown> {
    const instance = await ensureReady();
    const fn = instance[method];
    if (typeof fn !== 'function') {
        throw new Error(`Method '${method}' not found on WalletKit`);
    }
    return (fn as (...a: unknown[]) => unknown).apply(instance, args);
}

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

export async function getKit(): Promise<WalletKitInstance> {
    return ensureReady();
}

export async function getWallet(walletId: string): Promise<Wallet> {
    const instance = await ensureReady();
    return getWalletOrThrow(instance, walletId);
}

export async function walletCall<T = unknown>(
    method: string,
    args: { walletId: string; [k: string]: unknown },
): Promise<T> {
    const instance = await ensureReady();
    const w = getWalletOrThrow(instance, args.walletId);
    const fn = (w as unknown as Record<string, unknown>)[method];
    if (typeof fn !== 'function') {
        throw new Error(`Method '${method}' not found on Wallet`);
    }
    return (fn as (args?: unknown) => Promise<T>).call(w, args);
}

export async function clientCall<T = unknown>(
    method: string,
    args: { walletId: string; [k: string]: unknown },
): Promise<T> {
    const instance = await ensureReady();
    const w = getWalletOrThrow(instance, args.walletId);
    const apiClient = w.getClient();
    const fn = (apiClient as unknown as Record<string, unknown>)[method];
    if (typeof fn !== 'function') {
        throw new Error(`Method '${method}' not found on ApiClient`);
    }
    return (fn as (args?: unknown) => Promise<T>).call(apiClient, args);
}
