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

import type { WalletKitInstance } from '../core/state';
import { walletKit } from '../core/state';

/**
 * Unified wrapper for all bridge operations.
 * Handles initialization and ensures WalletKit is ready before executing operation.
 * Passes the initialized walletKit instance to the callback to avoid null assertions.
 *
 * @param _method - Operation name for error logging (unused, kept for API consistency)
 * @param operation - Function receiving the initialized walletKit instance
 * @returns Result of the operation
 */
export async function callBridge<T>(_method: string, operation: (kit: WalletKitInstance) => Promise<T>): Promise<T> {
    if (!walletKit) {
        throw new Error('WalletKit not initialized');
    }
    if (walletKit.ensureInitialized) {
        await walletKit.ensureInitialized();
    }
    return await operation(walletKit);
}

/**
 * Wrapper for wallet-specific operations.
 * Gets a wallet by walletId and calls a method on it.
 *
 * @param walletId - Wallet ID (format: "{chainId}:{address}")
 * @param method - Wallet method name to call
 * @param args - Optional arguments to pass to the method
 * @returns Result of the wallet method
 */
export async function callOnWalletBridge<T>(walletId: string, method: string, args?: unknown): Promise<T> {
    return callBridge(`wallet.${method}`, async (kit) => {
        const wallet = kit.getWallet?.(walletId);
        if (!wallet) {
            throw new Error(`Wallet not found: ${walletId}`);
        }
        const methodRef = (wallet as unknown as Record<string, unknown>)[method];
        if (typeof methodRef !== 'function') {
            throw new Error(`Method '${method}' not found on wallet`);
        }
        return (await (methodRef as (args?: unknown) => Promise<T>).call(wallet, args)) as T;
    });
}
