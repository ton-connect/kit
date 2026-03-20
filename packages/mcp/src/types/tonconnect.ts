/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DeviceInfo, WalletInfo } from '@ton/walletkit';

export type TonConnectRequestType = 'connect' | 'sendTransaction' | 'signData';
export type TonConnectRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'failed';

export interface TonConnectDappSummary {
    name?: string;
    url?: string;
    iconUrl?: string;
    manifestUrl?: string;
    domain?: string;
}

export interface TonConnectSummaryBase {
    requestId: string;
    type: TonConnectRequestType;
    sessionId?: string;
    walletId?: string;
    walletAddress?: string;
    dapp?: TonConnectDappSummary;
}

export interface TonConnectConnectSummary extends TonConnectSummaryBase {
    type: 'connect';
    requestedItems: string[];
    permissions: Array<{
        name?: string;
        title?: string;
        description?: string;
    }>;
    manifestFetchErrorCode?: number;
}

export interface TonConnectTransactionMessageSummary {
    address: string;
    amountNano: string;
    amountTon: string;
    hasPayload: boolean;
    hasStateInit: boolean;
    mode?: string;
}

export interface TonConnectTransactionSummary extends TonConnectSummaryBase {
    type: 'sendTransaction';
    validUntil?: number;
    fromAddress?: string;
    network?: string;
    messages: TonConnectTransactionMessageSummary[];
    preview?: {
        result?: unknown;
        error?: unknown;
        hasTrace: boolean;
        moneyFlow?: unknown;
    };
}

export interface TonConnectSignDataSummary extends TonConnectSummaryBase {
    type: 'signData';
    signDataType: 'text' | 'binary' | 'cell';
    domain?: string;
    previewText?: string;
    contentLength?: number;
    schema?: string;
    hasParsedData?: boolean;
}

export type TonConnectRequestSummary =
    | TonConnectConnectSummary
    | TonConnectTransactionSummary
    | TonConnectSignDataSummary;

export interface TonConnectRequestRecord {
    requestId: string;
    type: TonConnectRequestType;
    status: TonConnectRequestStatus;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    reason?: string;
    summary: TonConnectRequestSummary;
}

export interface TonConnectRequestListFilters {
    status?: TonConnectRequestStatus;
    type?: TonConnectRequestType;
    limit?: number;
}

export interface TonConnectSessionSummary {
    sessionId: string;
    walletId: string;
    walletAddress: string;
    createdAt: string;
    lastActivityAt: string;
    domain: string;
    dAppName?: string;
    dAppDescription?: string;
    dAppUrl?: string;
    dAppIconUrl?: string;
    isJsBridge?: boolean;
    schemaVersion: number;
}

export interface TonConnectRuntimeStatus {
    started: boolean;
    walletId?: string;
    walletAddress?: string;
    startedAt?: string;
    storagePath: string;
    bridgeUrl: string;
    pendingRequests: number;
    recentRequests: number;
    activeSessions: number;
    lastError?: string;
}

export interface TonConnectResolvedConfig {
    storagePath: string;
    storagePrefix: string;
    bridgeUrl: string;
    walletManifest?: WalletInfo;
    deviceInfo?: DeviceInfo;
}
