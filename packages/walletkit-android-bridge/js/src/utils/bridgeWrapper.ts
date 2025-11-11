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
 */

import { walletKit } from '../core/state';

/**
 * Unified wrapper for all bridge operations.
 * Handles initialization and ensures WalletKit is ready before executing operation.
 *
 * @param operation - Operation name for error logging
 * @param fn - Function containing the actual business logic
 * @returns Result of the operation
 */
export async function callBridge<T>(method: string, operation: () => Promise<T>): Promise<T> {
    if (!walletKit) {
        throw new Error('WalletKit not initialized');
    }
    if (walletKit.ensureInitialized) {
        await walletKit.ensureInitialized();
    }
    return await operation();
}

/**
 * Wrapper for wallet-specific operations.
 * Gets a wallet by address and calls a method on it.
 *
 * @param address - Wallet address
 * @param method - Wallet method name to call
 * @param args - Optional arguments to pass to the method
 * @returns Result of the wallet method
 */
export async function callOnWalletBridge<T>(address: string, method: string, args?: unknown): Promise<T> {
    return callBridge(`wallet.${method}`, async () => {
        const trimmedAddress = address?.trim();
        if (!trimmedAddress) {
            throw new Error('Wallet address is required');
        }

        const wallet = walletKit.getWallet?.(trimmedAddress);
        if (!wallet) {
            throw new Error(`Wallet not found for address ${trimmedAddress}`);
        }

        const methodRef = (wallet as unknown as Record<string, unknown>)[method];
        if (typeof methodRef !== 'function') {
            throw new Error(`Method '${method}' not found on wallet`);
        }

        return (await (methodRef as (args?: unknown) => Promise<T>).call(wallet, args)) as T;
    });
}
