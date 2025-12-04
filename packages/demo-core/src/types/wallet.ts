/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    JSBridgeTransportFunction,
    StorageAdapter as KitStorageAdapter,
} from '@ton/walletkit';

export interface SavedWallet {
    id: string;
    name: string;
    address: string;
    publicKey: string;
    encryptedMnemonic?: string;
    ledgerConfig?: LedgerConfig;
    walletType: 'mnemonic' | 'signer' | 'ledger';
    walletInterfaceType: 'signer' | 'mnemonic' | 'ledger';
    version?: 'v5r1' | 'v4r2';
    network: 'mainnet' | 'testnet';
    createdAt: number;
    /** WalletKit wallet ID */
    kitWalletId?: string;
}

export interface AuthState {
    auth: {
        currentPassword?: string;
        passwordHash?: number[];
        isPasswordSet?: boolean;
        isUnlocked?: boolean;
        persistPassword?: boolean;
        holdToSign?: boolean;
        useWalletInterfaceType?: 'signer' | 'mnemonic' | 'ledger';
        ledgerAccountNumber?: number;
    };
}

export interface PreviewTransaction {
    id: string;
    messageHash: string;
    type: 'send' | 'receive';
    amount: string;
    address: string;
    timestamp: number;
    status: 'pending' | 'confirmed' | 'failed';
    traceId?: string;
    externalMessageHash?: string;
}

export interface DisconnectNotification {
    walletAddress: string;
    reason?: string;
    timestamp: number;
}

export interface QueueRequestBase {
    id: string;
    timestamp: number;
    expiresAt: number;
}

export interface QueuedRequestConnect {
    type: 'connect';
    request: EventConnectRequest;
}

export interface QueuedRequestTransaction {
    type: 'transaction';
    request: EventTransactionRequest;
}

export interface QueuedRequestSignData {
    type: 'signData';
    request: EventSignDataRequest;
}

export type QueuedRequestData = QueuedRequestConnect | QueuedRequestTransaction | QueuedRequestSignData;

export type QueuedRequest = QueueRequestBase & QueuedRequestData;

export interface RequestQueue {
    items: QueuedRequest[];
    currentRequestId?: string;
    isProcessing: boolean;
}

export interface LedgerConfig {
    publicKey: string;
    path: number[];
    walletId: number;
    version: string;
    network: string;
    workchain: number;
    accountIndex: number;
}

export interface WalletKitConfig {
    storage?: KitStorageAdapter;
    jsBridgeTransport?: JSBridgeTransportFunction;
    disableHttpBridge?: boolean;
    disableNetworkSend?: boolean;
    bridgeUrl?: string;
    tonApiKeyMainnet?: string;
    tonApiKeyTestnet?: string;
}
