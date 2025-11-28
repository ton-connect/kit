/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Internal types for TonWalletKit modules

import {
    ConnectItem,
    SendTransactionRpcRequest,
    SignDataRpcRequest,
    WalletResponseError as _WalletResponseError,
    WalletResponseTemplateError,
    ConnectEventError,
} from '@tonconnect/protocol';

import { DAppInfo } from './events';
import { JSBridgeTransportFunction } from './jsBridge';

// import type { WalletInterface } from './wallet';

export interface SessionData {
    sessionId: string;

    walletAddress: string;
    createdAt: string; // date
    lastActivityAt: string; // date
    privateKey: string;
    publicKey: string;

    dAppName: string;
    dAppDescription: string;
    domain: string;
    dAppIconUrl: string;

    // Bridge type indicator (needed to determine how to send disconnect events)
    isJsBridge?: boolean; // true if session was created via JS Bridge, false/undefined for HTTP Bridge
}

export interface BridgeConfig {
    bridgeUrl?: string; // defaults to WalletInfo.bridgeUrl if exists
    enableJsBridge?: boolean; // default to true if WalletInfo.jsBridgeKey exists
    jsBridgeKey?: string; // defaults to WalletInfo.jsBridgeKey
    disableHttpConnection?: boolean; // default to false

    // Custom transport function for JS Bridge responses
    jsBridgeTransport?: JSBridgeTransportFunction;

    // settings for bridge-sdk
    heartbeatInterval?: number;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

export interface StorageAdapter {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EventCallback<T = any> {
    (event: T): void | Promise<void>;
}

export type BridgeEventBase = {
    id?: string;
    from?: string;
    walletAddress?: string;
    domain?: string;

    isJsBridge?: boolean;
    tabId?: number;
    sessionId?: string;
    isLocal?: boolean;
    messageId?: string;

    traceId?: string;

    /** dApp information */
    dAppInfo?: DAppInfo;
};

export type EventApprovalBase = {
    id: string;
    from: string;
    sessionId: string;
    walletAddress: string;

    messageId?: string;

    traceId?: string;
};

// Bridge event types (raw from bridge)
export interface RawBridgeEventGeneric extends BridgeEventBase {
    id: string;
    method: 'none';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: Record<string, any>;
    timestamp?: number;
}

export interface RawBridgeEventConnect extends BridgeEventBase {
    id: string;
    method: 'connect';
    params: {
        manifest?: {
            url?: string;
        };
        manifestUrl?: string;
        items: ConnectItem[];
        returnStrategy?: string;
    };
    timestamp?: number;
}

export interface RawBridgeEventRestoreConnection extends BridgeEventBase {
    id: string;
    method: 'restoreConnection';
    params: object; // no params
    timestamp?: number;
}

export interface ConnectExtraCurrency {
    [k: number]: string;
}

export interface ConnectTransactionParamMessage {
    address: string;
    amount: string;
    payload?: string; // boc
    stateInit?: string; // boc
    extraCurrency?: ConnectExtraCurrency;
    mode?: number;
}
export interface ConnectTransactionParamContent {
    messages: ConnectTransactionParamMessage[];
    network?: string;
    valid_until?: number; // unixtime
    from?: string;
}

export type RawBridgeEventTransaction = BridgeEventBase & SendTransactionRpcRequest;
export type RawBridgeEventSignData = BridgeEventBase & SignDataRpcRequest;

export interface RawBridgeEventDisconnect extends BridgeEventBase {
    id: string;
    method: 'disconnect';
    params: {
        reason?: string;
    };
    timestamp?: number;
}

export type RawBridgeEvent =
    | RawBridgeEventGeneric
    | RawBridgeEventConnect
    | RawBridgeEventRestoreConnection
    | RawBridgeEventTransaction
    | RawBridgeEventSignData
    | RawBridgeEventDisconnect;

// Internal event routing types
export type EventType = 'connect' | 'sendTransaction' | 'signData' | 'disconnect' | 'restoreConnection';

// Handler error response types - either RPC error format or connect error format
export type HandlerErrorResponse = WalletResponseTemplateError | ConnectEventError;

export interface EventHandler<T extends BridgeEventBase = BridgeEventBase, V extends RawBridgeEvent = RawBridgeEvent> {
    canHandle(event: RawBridgeEvent): event is V;
    handle(event: V): Promise<T | HandlerErrorResponse>;
    notify(event: T): Promise<void>;
}
