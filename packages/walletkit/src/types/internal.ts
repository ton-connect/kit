/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Internal types for TonWalletKit modules

import type {
    ConnectItem,
    SendTransactionRpcRequest,
    SignDataRpcRequest,
    WalletResponseTemplateError,
    CHAIN,
} from '@tonconnect/protocol';
import { WalletResponseError as _WalletResponseError } from '@tonconnect/protocol';

import type { JSBridgeTransportFunction } from './jsBridge';
import type {
    ExtraCurrencies,
    TransactionRequest,
    TransactionRequestMessage,
    BridgeEvent,
    Base64String,
} from '../api/models';
import { SendModeFromValue } from '../utils/sendMode';
import { SendModeToValue } from '../utils/sendMode';
import { asAddressFriendly } from '../utils/address';

// import type { WalletInterface } from './wallet';

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

// Bridge event types (raw from bridge)
export interface RawBridgeEventGeneric extends BridgeEvent {
    id: string;
    method: 'none';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: Record<string, any>;
    timestamp?: number;
}

export interface RawBridgeEventConnect extends BridgeEvent {
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

export interface RawBridgeEventRestoreConnection extends BridgeEvent {
    id: string;
    method: 'restoreConnection';
    params: object; // no params
    timestamp?: number;
}

export interface ConnectExtraCurrency {
    [k: number]: string;
}

export interface ConnectTransactionParamMessage {
    address: string; // address as passed from client
    amount: string;
    payload?: string; // boc
    stateInit?: string; // boc
    extraCurrency?: ConnectExtraCurrency;
    mode?: number;
}

export function toExtraCurrencies(extraCurrency: ConnectExtraCurrency | undefined): ExtraCurrencies | undefined {
    if (!extraCurrency) {
        return undefined;
    }
    return extraCurrency as ExtraCurrencies;
}

/**
 * Raw transaction params as received from TON Connect protocol
 */
export interface RawConnectTransactionParamContent {
    messages: ConnectTransactionParamMessage[];
    network?: CHAIN;
    valid_until?: number;
    from?: string;
}

export interface ConnectTransactionParamContent {
    messages: ConnectTransactionParamMessage[];
    network?: CHAIN;
    validUntil?: number;
    from?: string;
}

/**
 * Parse raw TON Connect transaction params to internal format
 */
export function parseConnectTransactionParamContent(
    raw: RawConnectTransactionParamContent,
): ConnectTransactionParamContent {
    return {
        messages: raw.messages,
        network: raw.network,
        validUntil: raw.valid_until,
        from: raw.from,
    };
}

export function toTransactionRequestMessage(msg: ConnectTransactionParamMessage): TransactionRequestMessage {
    // Check that msg.address is valid address
    asAddressFriendly(msg.address);

    return {
        address: msg.address,
        amount: msg.amount,
        payload: msg.payload ? (msg.payload as Base64String) : undefined,
        stateInit: msg.stateInit ? (msg.stateInit as Base64String) : undefined,
        extraCurrency: toExtraCurrencies(msg.extraCurrency),
        mode: msg.mode ? SendModeFromValue(msg.mode) : undefined,
    };
}

export function toConnectTransactionParamMessage(message: TransactionRequestMessage): ConnectTransactionParamMessage {
    return {
        address: message.address,
        amount: message.amount,
        payload: message.payload,
        stateInit: message.stateInit,
        extraCurrency: message.extraCurrency as ConnectExtraCurrency | undefined,
        mode: message.mode ? SendModeToValue(message.mode) : undefined,
    };
}

/**
 * Convert internal params format to TransactionRequest model.
 */
export function toTransactionRequest(params: ConnectTransactionParamContent): TransactionRequest {
    return {
        messages: params.messages.map(toTransactionRequestMessage),
        network: params.network ? { chainId: params.network } : undefined,
        validUntil: params.validUntil,
        fromAddress: params.from,
    };
}

/**
 * Convert internal TransactionRequest to raw TON Connect protocol
 */
export function toConnectTransactionParamContent(request: TransactionRequest): RawConnectTransactionParamContent {
    return {
        messages: request.messages.map(toConnectTransactionParamMessage),
        network: request.network?.chainId as CHAIN,
        valid_until: request.validUntil,
        from: request.fromAddress,
    };
}

export type RawBridgeEventTransaction = BridgeEvent & SendTransactionRpcRequest;
export type RawBridgeEventSignData = BridgeEvent & SignDataRpcRequest;

export interface RawBridgeEventDisconnect extends BridgeEvent {
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

export interface EventHandler<T extends BridgeEvent = BridgeEvent, V extends RawBridgeEvent = RawBridgeEvent> {
    canHandle(event: RawBridgeEvent): event is V;
    handle(event: V): Promise<T | WalletResponseTemplateError>;
    notify(event: T): Promise<void>;
}
