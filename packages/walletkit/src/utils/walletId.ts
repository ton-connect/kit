/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Wallet ID utilities for multi-network support

import { CHAIN } from '@tonconnect/protocol';

/**
 * Wallet ID format: "network:address"
 * Examples:
 * - "-239:EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2" (mainnet)
 * - "-3:EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2" (testnet)
 */
export type WalletId = string;

/**
 * Creates a wallet ID from network and address
 */
export function createWalletId(network: CHAIN, address: string): WalletId {
    return `${network}:${address}`;
}

/**
 * Parses a wallet ID into network and address components
 * Returns undefined if the wallet ID is invalid
 */
export function parseWalletId(walletId: WalletId): { network: CHAIN; address: string } | undefined {
    const colonIndex = walletId.indexOf(':');
    if (colonIndex === -1) {
        return undefined;
    }

    const networkStr = walletId.substring(0, colonIndex);
    const address = walletId.substring(colonIndex + 1);

    if (networkStr !== CHAIN.MAINNET && networkStr !== CHAIN.TESTNET) {
        return undefined;
    }

    if (!address) {
        return undefined;
    }

    return {
        network: networkStr as CHAIN,
        address,
    };
}

/**
 * Extracts the address from a wallet ID
 * Returns the original string if it's not a valid wallet ID (for backwards compatibility)
 */
export function getAddressFromWalletId(walletId: WalletId): string {
    const parsed = parseWalletId(walletId);
    return parsed?.address ?? walletId;
}

/**
 * Extracts the network from a wallet ID
 * Returns undefined if the wallet ID is invalid
 */
export function getNetworkFromWalletId(walletId: WalletId): CHAIN | undefined {
    const parsed = parseWalletId(walletId);
    return parsed?.network;
}

/**
 * Checks if a string is a valid wallet ID format
 */
export function isWalletId(value: string): value is WalletId {
    return parseWalletId(value) !== undefined;
}
