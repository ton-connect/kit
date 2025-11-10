/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Miscellaneous helper utilities shared across bridge modules.
 */

export interface CallOnWalletDeps {
    walletKit: {
        getWallet?: (address: string) => unknown;
    };
    requireWalletKit: () => void;
}

/**
 * Calls a method on a wallet instance resolved by address.
 *
 * @param deps - Minimal dependencies required to look up wallets and enforce initialization.
 * @param address - Wallet address whose instance should receive the call.
 * @param method - Wallet method name.
 * @param args - Optional arguments forwarded to the wallet method.
 */
export async function callOnWallet<T>(
    deps: CallOnWalletDeps,
    address: string,
    method: string,
    args?: unknown,
): Promise<T> {
    deps.requireWalletKit();

    const trimmedAddress = address?.trim();
    if (!trimmedAddress) {
        throw new Error('Wallet address is required');
    }

    const wallet = deps.walletKit.getWallet?.(trimmedAddress);
    if (!wallet) {
        throw new Error(`Wallet not found for address ${trimmedAddress}`);
    }

    const methodRef = (wallet as Record<string, unknown>)[method];
    if (typeof methodRef !== 'function') {
        throw new Error(`Method '${method}' not found on wallet`);
    }

    if (args !== undefined) {
        return await (methodRef as (input: unknown) => Promise<T> | T).call(wallet, args);
    }
    return await (methodRef as () => Promise<T> | T).call(wallet);
}
