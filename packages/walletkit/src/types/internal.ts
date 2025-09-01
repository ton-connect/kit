// Internal types for TonWalletKit modules

import { ConnectItem, SendTransactionRpcRequest, SignDataRpcRequest } from '@tonconnect/protocol';

import type { WalletInterface } from './wallet';

export interface SessionData {
    sessionId: string;
    dAppName: string;
    domain: string;
    walletAddress: string;
    wallet?: WalletInterface;
    createdAt: Date;
    lastActivityAt: Date;
    privateKey: string;
    publicKey: string;
}

export interface SessionStorageData {
    sessionId: string;
    dAppName: string;
    domain: string;
    walletAddress: string;
    createdAt: string;
    lastActivityAt: string;
    privateKey: string;
    publicKey: string;
}

export interface BridgeConfig {
    bridgeUrl?: string;
    bridgeName?: string;
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

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

type BridgeEventBase = {
    from: string;
    walletAddress?: string;
    wallet?: WalletInterface;
    domain: string;

    isJsBridge?: boolean;
    tabId?: number;
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

export interface ConnectExtraCurrency {
    [k: number]: string;
}

export interface ConnectTransactionParamContent {
    messages: {
        address: string;
        amount: string;
        payload?: string; // boc
        stateInit?: string; // boc
        extraCurrency?: ConnectExtraCurrency;
    }[];
    network: string;
    valid_until: number; // unixtime
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
    | RawBridgeEventTransaction
    | RawBridgeEventSignData
    | RawBridgeEventDisconnect;

// Internal event routing types
export type EventType = 'connect' | 'sendTransaction' | 'signData' | 'disconnect';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EventHandler<T = any, V extends RawBridgeEvent = RawBridgeEvent> {
    canHandle(event: RawBridgeEvent): event is V;
    handle(event: V): Promise<T>;
    notify(event: T): Promise<void>;
}
