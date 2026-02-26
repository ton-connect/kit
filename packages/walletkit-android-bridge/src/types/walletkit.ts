/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    ApiClient,
    BatchedIntentEvent,
    BridgeEventMessageInfo,
    ConnectionApprovalProof,
    ConnectionApprovalResponse,
    ConnectionRequestEvent,
    DeviceInfo,
    DisconnectionEvent,
    InjectedToExtensionBridgeRequestPayload,
    IntentActionItem,
    IntentErrorResponse,
    IntentRequestEvent,
    IntentSignDataResponse,
    IntentTransactionResponse,
    ActionIntentRequestEvent,
    Network,
    RequestErrorEvent,
    SendTransactionApprovalResponse,
    SendTransactionRequestEvent,
    SignDataApprovalResponse,
    SignDataIntentRequestEvent,
    SignDataRequestEvent,
    TONConnectSession,
    TransactionIntentRequestEvent,
    TransactionRequest,
    Wallet,
    WalletAdapter,
    WalletInfo,
    WalletSigner,
} from '@ton/walletkit';
import type { CONNECT_EVENT_ERROR_CODES, SendTransactionRpcResponseError } from '@tonconnect/protocol';

/**
 * Configuration and bridge-facing types for Ton WalletKit.
 */
export interface WalletKitBridgeInitConfig {
    bridgeUrl?: string;
    bridgeName?: string;
    allowMemoryStorage?: boolean;
    walletManifest?: WalletInfo;
    deviceInfo?: DeviceInfo;
    disableNetworkSend?: boolean;
    disableTransactionEmulation?: boolean;
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
    getApiClient(network?: Network): ApiClient;
    addWallet(adapter: WalletAdapter): Promise<Wallet | null>;
    handleNewTransaction(wallet: Wallet, transaction: TransactionRequest): Promise<void>;
    handleTonConnectUrl(url: string): Promise<void>;
    listSessions?(): Promise<TONConnectSession[]>;
    disconnect?(sessionId?: string): Promise<void>;
    processInjectedBridgeRequest?(
        messageInfo: BridgeEventMessageInfo,
        request: InjectedToExtensionBridgeRequestPayload,
    ): Promise<void>;
    onConnectRequest(callback: (event: ConnectionRequestEvent) => void): void;
    removeConnectRequestCallback(): void;
    onTransactionRequest(callback: (event: SendTransactionRequestEvent) => void): void;
    removeTransactionRequestCallback(): void;
    onSignDataRequest(callback: (event: SignDataRequestEvent) => void): void;
    removeSignDataRequestCallback(): void;
    onDisconnect(callback: (event: DisconnectionEvent) => void): void;
    removeDisconnectCallback(): void;
    onRequestError(callback: (event: RequestErrorEvent) => void): void;
    removeErrorCallback(): void;
    // Request approval methods - event and response are separate parameters
    approveConnectRequest(event: ConnectionRequestEvent, response?: ConnectionApprovalResponse): Promise<void>;
    rejectConnectRequest(
        event: ConnectionRequestEvent,
        reason?: string,
        errorCode?: CONNECT_EVENT_ERROR_CODES,
    ): Promise<void>;
    approveTransactionRequest(
        event: SendTransactionRequestEvent,
        response?: SendTransactionApprovalResponse,
    ): Promise<SendTransactionApprovalResponse>;
    rejectTransactionRequest(
        event: SendTransactionRequestEvent,
        reason?: string | SendTransactionRpcResponseError['error'],
    ): Promise<void>;
    approveSignDataRequest(
        event: SignDataRequestEvent,
        response?: SignDataApprovalResponse,
    ): Promise<SignDataApprovalResponse>;
    rejectSignDataRequest(
        event: SignDataRequestEvent,
        reason?: string | SendTransactionRpcResponseError['error'],
    ): Promise<void>;
    // Intent API
    isIntentUrl(url: string): boolean;
    handleIntentUrl(url: string, walletId: string): Promise<void>;
    onIntentRequest(cb: (event: IntentRequestEvent | BatchedIntentEvent) => void): void;
    removeIntentRequestCallback(cb: (event: IntentRequestEvent | BatchedIntentEvent) => void): void;
    approveTransactionIntent(
        event: TransactionIntentRequestEvent,
        walletId: string,
    ): Promise<IntentTransactionResponse>;
    approveSignDataIntent(event: SignDataIntentRequestEvent, walletId: string): Promise<IntentSignDataResponse>;
    approveActionIntent(
        event: ActionIntentRequestEvent,
        walletId: string,
    ): Promise<IntentTransactionResponse | IntentSignDataResponse>;
    rejectIntent(event: IntentRequestEvent, reason?: string, errorCode?: number): Promise<IntentErrorResponse>;
    intentItemsToTransactionRequest(items: IntentActionItem[], walletId: string): Promise<TransactionRequest>;
    processConnectAfterIntent(
        event: IntentRequestEvent | BatchedIntentEvent,
        walletId: string,
        proof?: ConnectionApprovalProof,
    ): Promise<void>;
}
