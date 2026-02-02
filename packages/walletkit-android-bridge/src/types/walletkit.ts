/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Wallet, WalletAdapter, WalletSigner, Network } from '@ton/walletkit';

/**
 * Configuration and bridge-facing types for Ton WalletKit.
 */
export interface WalletKitBridgeInitConfig {
    bridgeUrl?: string;
    bridgeName?: string;
    allowMemoryStorage?: boolean;
    walletManifest?: unknown;
    deviceInfo?: unknown;
    disableNetworkSend?: boolean;
    /**
     * Network configurations matching native SDK format.
     * Each entry has a network with chainId and optional apiClientConfiguration.
     */
    networkConfigurations?: Array<{
        network: { chainId: string };
        apiClientConfiguration?: {
            url?: string;
            key?: string;
        };
    }>;
}

export interface AndroidBridgeType {
    postMessage(json: string): void;
}

export interface WalletKitNativeBridgeType {
    postMessage(json: string): void;
    signWithCustomSigner?(signerId: string, bytes: number[]): Promise<string>;
}

export type WalletKitAdapter = WalletAdapter;
export type WalletKitSigner = WalletSigner;

export interface WalletKitInstance {
    ensureInitialized?: () => Promise<void>;
    getWallets: () => Wallet[];
    getWallet(walletId: string): Wallet | undefined;
    getNetwork?: () => string;
    removeWallet(walletId: string): Promise<void>;
    getApiClient(network?: Network): unknown;
    addWallet(adapter: unknown): Promise<Wallet | null>;
    handleNewTransaction(wallet: Wallet, transaction: unknown): Promise<unknown>;
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
    // Request approval methods - event and response are separate parameters
    approveConnectRequest(event: unknown, response?: unknown): Promise<unknown>;
    rejectConnectRequest(event: unknown, reason?: string, errorCode?: number): Promise<unknown>;
    approveTransactionRequest(event: unknown, response?: unknown): Promise<unknown>;
    rejectTransactionRequest(event: unknown, reason?: string | { code: number; message: string }): Promise<unknown>;
    approveSignDataRequest(event: unknown, response?: unknown): Promise<unknown>;
    rejectSignDataRequest(event: unknown, reason?: string | { code: number; message: string }): Promise<unknown>;
}
