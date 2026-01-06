/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// AppKit types - bridge between @tonconnect/sdk and TonWalletKit

import type TonConnect from '@tonconnect/sdk';
import type { Wallet as TonConnectWallet } from '@tonconnect/sdk';
import type { TransactionRequest, Wallet } from '@ton/walletkit';

export interface Storage {
    /**
     * Saves the `value` to the storage. Value can be accessed later by the `key`. Implementation may use backend as a storage due to the fact that the function returns a promise.
     * @param key key to access to the value later.
     * @param value value to save.
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Reads the `value` from the storage. Implementation may use backend as a storage due to the fact that the function returns a promise.
     * @param key key to access the value.
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Removes the `value` from the storage. Implementation may use backend as a storage due to the fact that the function returns a promise.
     * @param key key to access the value.
     */
    removeItem(key: string): Promise<void>;
}

/**
 * Configuration for the AppKit
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AppKitConfig {
    /** TonWalletKit instance that will receive the requests */
    // walletKit: TonWalletKit;
    /** Manifest URL for TonConnect */
    // manifestUrl?: string;
}

/**
 * Wrapper around @tonconnect/sdk Wallet that provides TonWalletKit-compatible interface
 */
export interface TonConnectWalletWrapper extends Wallet {
    /** The underlying TonConnect wallet */
    readonly tonConnectWallet: TonConnectWallet;

    /** The underlying TonConnect instance */
    readonly tonConnect: TonConnect;

    /** Check if the wallet is connected */
    isConnected(): boolean;

    /** Get connection info */
    getConnectionInfo(): {
        account: {
            address: string;
            chain: string;
            walletStateInit: string;
            publicKey?: string;
        };
        device: {
            appName: string;
            appVersion: string;
            platform: string;
        };
    } | null;
}

/**
 * AppKit main interface
 */
export interface AppKit {
    /**
     * Create a TonWalletKit-compatible wrapper for a TonConnect wallet
     * @param wallet - The connected TonConnect wallet
     * @returns Wrapped wallet with TonWalletKit interface
     */
    wrapWallet(wallet: TonConnectWallet): TonConnectWalletWrapper;

    handleNewTransaction(
        wallet: TonConnectWalletWrapper,
        transaction: TransactionRequest,
    ): Promise<{
        boc: string;
    }>;

    /**
     * Get the underlying TonWalletKit instance
     */
    // getWalletKit(): TonWalletKit;
}
