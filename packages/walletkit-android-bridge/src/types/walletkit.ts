/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletAdapter, WalletSigner, Network } from '@ton/walletkit';

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
    disableNetworkSend?: boolean;
}

export interface AndroidBridgeType {
    postMessage(json: string): void;
}

export interface WalletKitNativeBridgeType {
    postMessage(json: string): void;
    signWithCustomSigner?(signerId: string, bytes: number[]): Promise<string>;
}

/**
 * Loose wallet type for bridge pass-through.
 * Uses unknown/any for methods since Kotlin handles the actual data.
 */
export interface WalletKitWallet {
    getWalletId?(): string;
    getAddress?(): string;
    getBalance?(): Promise<unknown>;
    getClient(): { getAccountTransactions(params: unknown): Promise<{ transactions?: unknown[] }> };
    createTransferTonTransaction(params: unknown): Promise<unknown>;
    createTransferMultiTonTransaction(params: unknown): Promise<unknown>;
    getTransactionPreview?(transaction: unknown): Promise<unknown>;
    sendTransaction(transaction: unknown): Promise<unknown>;
    // NFT methods
    getNfts?(params: unknown): Promise<unknown>;
    getNft?(address: string): Promise<unknown>;
    createTransferNftTransaction?(params: unknown): Promise<unknown>;
    createTransferNftRawTransaction?(params: unknown): Promise<unknown>;
    // Jetton methods
    getJettons?(params: unknown): Promise<unknown>;
    createTransferJettonTransaction?(params: unknown): Promise<unknown>;
    getJettonBalance?(address: string): Promise<unknown>;
    getJettonWalletAddress?(address: string): Promise<unknown>;
}
export type WalletKitAdapter = WalletAdapter;
export type WalletKitSigner = WalletSigner;

export interface WalletKitInstance {
    ensureInitialized?: () => Promise<void>;
    getWallets: () => WalletKitWallet[];
    getWallet(walletId: string): WalletKitWallet | undefined;
    getNetwork?: () => string;
    removeWallet(walletId: string): Promise<void>;
    getApiClient(network?: Network): unknown;
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
    onRequestError(callback: (event: unknown) => void): void;
    removeErrorCallback(): void;
    // Request approval methods
    approveConnectRequest(event: unknown): Promise<unknown>;
    rejectConnectRequest(event: unknown, reason?: string, errorCode?: number): Promise<unknown>;
    approveTransactionRequest(event: unknown): Promise<unknown>;
    rejectTransactionRequest(event: unknown, reason?: string | { code: number; message: string }): Promise<unknown>;
    approveSignDataRequest(event: unknown): Promise<unknown>;
    rejectSignDataRequest(event: unknown, reason?: string | { code: number; message: string }): Promise<unknown>;
    // SignMessage methods for gasless transactions
    onSignMessageRequest?(callback: (event: unknown) => void): void;
    removeSignMessageRequestCallback?(): void;
    approveSignMessageRequest(event: unknown): Promise<unknown>;
    rejectSignMessageRequest(event: unknown, reason?: string | { code: number; message: string }): Promise<unknown>;
}
