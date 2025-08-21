// Internal types for TonWalletKit modules

import { ConnectItem, ConnectRequest, SendTransactionRpcRequest } from '@tonconnect/protocol';

import type { WalletInterface } from './wallet';

export interface SessionData {
    sessionId: string;
    dAppName: string;
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
    walletAddress: string;
    createdAt: string;
    lastActivityAt: string;
    privateKey: string;
    publicKey: string;
}

export interface BridgeConfig {
    bridgeUrl: string;
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

export interface RequestContext {
    id: string;
    sessionId?: string;
    timestamp: Date;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

type BridgeEventBase = { from: string; wallet?: WalletInterface };

// Bridge event types (raw from bridge)
export interface RawBridgeEventGeneric extends BridgeEventBase {
    id: string;
    method: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: Record<string, any>;
    sessionId?: string;
    timestamp?: number;
}

export interface RawBridgeEventConnect extends BridgeEventBase {
    id: string;
    method: 'startConnect';
    params: {
        manifest: {
            url: string;
        };
        items: ConnectItem[];
        returnStrategy?: string;
    };
    sessionId?: string;
    timestamp?: number;
}

export interface ConnectTransactionParamContent {
    messages: {
        address: string;
        amount: string;
        payload?: string; // boc
        stateInit?: string; // boc
    }[];
    network: string;
    valid_until: number; // unixtime
    from?: string;
}

export type RawBridgeEventTransaction = BridgeEventBase & SendTransactionRpcRequest;

export type RawBridgeEvent = RawBridgeEventGeneric | RawBridgeEventConnect | RawBridgeEventTransaction;

// Internal event routing types
export type EventType = 'startConnect' | 'sendTransaction' | 'signData' | 'disconnect';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EventHandler<T = any> {
    canHandle(event: RawBridgeEvent): boolean;
    handle(event: RawBridgeEvent, context: RequestContext): Promise<T>;
}
