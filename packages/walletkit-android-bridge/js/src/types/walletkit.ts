/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    CreateTransferTonTransactionArgs,
    CreateTransferMultiTonTransactionArgs,
    WalletKitBridgeApi,
} from './api';

/**
 * Configuration and bridge-facing types for Ton WalletKit.
 */
export interface WalletKitBridgeInitConfig {
    network?: string;
    apiUrl?: string;
    apiBaseUrl?: string;
    tonApiUrl?: string;
    tonClientEndpoint?: string;
    bridgeUrl?: string;
    bridgeName?: string;
    allowMemoryStorage?: boolean;
    walletManifest?: unknown;
    deviceInfo?: unknown;
}

export interface AndroidBridgeType {
    postMessage(json: string): void;
}

export interface WalletKitNativeBridgeType {
    postMessage(json: string): void;
}

export interface WalletKitWallet {
    address?: string;
    publicKey: string;
    version?: string;
    getAddress(): string;
    getBalance(): Promise<unknown>;
    getTransactions?(limit: number): Promise<unknown[]>;
    getTransactionPreview?(transaction: unknown): Promise<{ preview?: unknown } | unknown>;
    createTransferTonTransaction(args: CreateTransferTonTransactionArgs): Promise<unknown>;
    createTransferMultiTonTransaction(args: CreateTransferMultiTonTransactionArgs): Promise<unknown>;
    sendTransaction(transaction: unknown): Promise<{ signedBoc: unknown }>;
    client: {
        getAccountTransactions(args: { address: string[]; limit: number }): Promise<
            | {
                  transactions?: unknown[];
              }
            | undefined
        >;
    };
}

export interface WalletKitAdapter {
    getAddress(): string;
}

export interface WalletKitSigner {
    publicKey: string;
}

export interface WalletKitInstance extends WalletKitBridgeApi {
    ensureInitialized?: () => Promise<void>;
    getWallets: () => WalletKitWallet[];
    getWallet(address: string): WalletKitWallet | undefined;
    getNetwork?: () => string;
    removeWallet(address: string): Promise<void>;
    getApiClient(): unknown;
    addWallet(adapter: unknown): Promise<WalletKitWallet | null>;
    handleNewTransaction(wallet: WalletKitWallet, transaction: unknown): Promise<unknown>;
    handleTonConnectUrl(url: string): Promise<unknown>;
    listSessions?(): Promise<unknown>;
    disconnect?(sessionId?: string): Promise<void>;
    processInjectedBridgeRequest?(
        messageInfo: Record<string, unknown>,
        request: Record<string, unknown>,
    ): Promise<unknown>;
    onConnectRequest(callback: (event: unknown) => void): void;
    removeConnectRequestCallback(): void;
    onTransactionRequest(callback: (event: unknown) => void): void;
    removeTransactionRequestCallback(): void;
    onSignDataRequest(callback: (event: unknown) => void): void;
    removeSignDataRequestCallback(): void;
    onDisconnect(callback: (event: unknown) => void): void;
    removeDisconnectCallback(): void;
    signDataRequest(event: unknown): Promise<unknown>;
}
