/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * bridgeWrapper.ts - Unified bridge operation wrappers
 *
 * Provides consistent initialization and error handling for all bridge operations.
 * Eliminates duplicate ensureWalletKitLoaded/requireWalletKit calls across API files.
 */

import { ensureWalletKitLoaded } from '../core/moduleLoader';
import { requireWalletKit } from '../core/initialization';
import { walletKit } from '../core/state';
import { callOnWallet } from './helpers';
import { logError } from './logger';

/**
 * Unified wrapper for all bridge operations.
 * Handles initialization and ensures WalletKit is ready before executing operation.
 *
 * @param operation - Operation name for error logging
 * @param fn - Function containing the actual business logic
 * @returns Result of the operation
 */
export async function callBridge<T>(operation: string, fn: () => Promise<T> | T): Promise<T> {
    await ensureWalletKitLoaded();
    requireWalletKit();

    if (typeof walletKit.ensureInitialized === 'function') {
        await walletKit.ensureInitialized();
    }

    try {
        return await fn();
    } catch (error) {
        logError(`[${operation}] failed:`, error);
        throw error;
    }
}

/**
 * Wrapper for wallet-specific operations.
 * Combines callBridge with callOnWallet for consistent wallet method invocations.
 *
 * @param address - Wallet address
 * @param method - Wallet method name to call
 * @param args - Optional arguments to pass to the method
 * @returns Result of the wallet method
 */
export async function callOnWalletBridge<T>(address: string, method: string, args?: unknown): Promise<T> {
    return callBridge(`callOnWallet:${method}`, async () => {
        return await callOnWallet<T>({ walletKit, requireWalletKit }, address, method, args);
    });
}

/**
 * Lightweight wrapper for operations that don't need ensureInitialized.
 * Use for operations that only need WalletKit loaded but not fully initialized.
 *
 * @param operation - Operation name for error logging
 * @param fn - Function containing the actual business logic
 * @returns Result of the operation
 */
export async function callBridgeLight<T>(operation: string, fn: () => Promise<T> | T): Promise<T> {
    await ensureWalletKitLoaded();
    requireWalletKit();

    try {
        return await fn();
    } catch (error) {
        logError(`[${operation}] failed:`, error);
        throw error;
    }
}
