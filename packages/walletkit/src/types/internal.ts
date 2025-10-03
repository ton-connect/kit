// Internal types for TonWalletKit modules

import {
    ConnectItem,
    SendTransactionRpcRequest,
    SignDataRpcRequest,
    WalletResponseError as _WalletResponseError,
    WalletResponseTemplateError,
} from '@tonconnect/protocol';

import { DAppInfo } from './events';

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
}

export interface BridgeConfig {
    bridgeUrl?: string; // defaults to WalletInfo.bridgeUrl if exists
    enableJsBridge?: boolean; // default to true if WalletInfo.jsBridgeKey exists
    jsBridgeKey?: string; // defaults to WalletInfo.jsBridgeKey

    // settings for bridge-sdk
    heartbeatInterval?: number;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

export interface StorageAdapter {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
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

export interface EventHandler<T extends BridgeEventBase = BridgeEventBase, V extends RawBridgeEvent = RawBridgeEvent> {
    canHandle(event: RawBridgeEvent): event is V;
    handle(event: V): Promise<T | WalletResponseTemplateError>;
    notify(event: T): Promise<void>;
}

export type SendRequestSuccess<T = undefined> = T extends undefined ? { success: true } : { success: true; result: T };
export type SendRequestError = { success: false; code: number; message?: string; error?: Error };
export type SendRequestResult<T = undefined> = SendRequestSuccess<T> | SendRequestError;
