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
    SignDataPayload as TonConnectSignDataPayload,
    WalletResponseTemplateError,
    ChainId,
} from '@tonconnect/protocol';
import { WalletResponseError as _WalletResponseError } from '@tonconnect/protocol';

import type { JSBridgeTransportFunction } from './jsBridge';
import type { IntentAction } from '../api/models';
import type {
    ExtraCurrencies,
    TransactionRequest,
    TransactionRequestMessage,
    BridgeEvent,
    Base64String,
    SignData,
    SignDataPayload,
} from '../api/models';
import { Network } from '../api/models';
import { validateSignDataPayload } from '../validation/signData';
import type { StructuredItem } from '../api/models/transactions/StructuredItem';
import { SendModeFromValue } from '../utils/sendMode';
import { SendModeToValue } from '../utils/sendMode';
import { asAddressFriendly } from '../utils/address';
import { asBase64 } from '../utils/base64';

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
    /** Parsed intent action from the `req` URL parameter (embedded requests). */
    intentPayload?: IntentAction;
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

/** Snake_case wire-format items as received in JSON-RPC payload */
export type RawStructuredItem = RawTonTransferItem | RawJettonTransferItem | RawNftTransferItem;

export interface RawTonTransferItem {
    type: 'ton';
    address: string;
    amount: string;
    payload?: string;
    stateInit?: string;
    extra_currency?: { [k: number]: string };
}

export interface RawJettonTransferItem {
    type: 'jetton';
    master: string;
    destination: string;
    amount: string;
    attachAmount?: string;
    queryId?: string;
    responseDestination?: string;
    customPayload?: string;
    forwardAmount?: string;
    forwardPayload?: string;
}

export interface RawNftTransferItem {
    type: 'nft';
    nftAddress: string;
    newOwner: string;
    attachAmount?: string;
    queryId?: string;
    responseDestination?: string;
    customPayload?: string;
    forwardAmount?: string;
    forwardPayload?: string;
}

export function parseRawStructuredItem(raw: RawStructuredItem): StructuredItem {
    switch (raw.type) {
        case 'ton':
            return {
                type: 'ton',
                address: raw.address,
                amount: raw.amount,
                payload: raw.payload ? asBase64(raw.payload) : undefined,
                stateInit: raw.stateInit ? asBase64(raw.stateInit) : undefined,
                extraCurrency: raw.extra_currency as ExtraCurrencies | undefined,
            };
        case 'jetton':
            return {
                type: 'jetton',
                master: raw.master,
                destination: raw.destination,
                amount: raw.amount,
                attachAmount: raw.attachAmount,
                queryId: raw.queryId,
                responseDestination: raw.responseDestination,
                customPayload: raw.customPayload ? asBase64(raw.customPayload) : undefined,
                forwardAmount: raw.forwardAmount,
                forwardPayload: raw.forwardPayload ? asBase64(raw.forwardPayload) : undefined,
            };
        case 'nft':
            return {
                type: 'nft',
                nftAddress: raw.nftAddress,
                newOwner: raw.newOwner,
                attachAmount: raw.attachAmount,
                queryId: raw.queryId,
                responseDestination: raw.responseDestination,
                customPayload: raw.customPayload ? asBase64(raw.customPayload) : undefined,
                forwardAmount: raw.forwardAmount,
                forwardPayload: raw.forwardPayload ? asBase64(raw.forwardPayload) : undefined,
            };
    }
}

export function toRawStructuredItem(item: StructuredItem): RawStructuredItem {
    switch (item.type) {
        case 'ton':
            return {
                type: 'ton',
                address: item.address,
                amount: item.amount,
                payload: item.payload,
                stateInit: item.stateInit,
                extra_currency: item.extraCurrency,
            };
        case 'jetton':
            return {
                type: 'jetton',
                master: item.master,
                destination: item.destination,
                amount: item.amount,
                attachAmount: item.attachAmount,
                responseDestination: item.responseDestination,
                customPayload: item.customPayload,
                forwardAmount: item.forwardAmount,
                forwardPayload: item.forwardPayload,
            };
        case 'nft':
            return {
                type: 'nft',
                nftAddress: item.nftAddress,
                newOwner: item.newOwner,
                attachAmount: item.attachAmount,
                responseDestination: item.responseDestination,
                customPayload: item.customPayload,
                forwardAmount: item.forwardAmount,
                forwardPayload: item.forwardPayload,
            };
    }
}

export function toExtraCurrencies(extraCurrency: ConnectExtraCurrency | undefined): ExtraCurrencies | undefined {
    if (!extraCurrency) {
        return undefined;
    }
    return extraCurrency as ExtraCurrencies;
}

/**
 * Raw transaction params as received from TON Connect protocol.
 * Contains either `messages` (raw format) or `items` (structured format), never both.
 */
export interface RawConnectTransactionParamContent {
    messages?: ConnectTransactionParamMessage[];
    items?: RawStructuredItem[];
    network?: ChainId;
    valid_until?: number;
    from?: string;
}

export interface ConnectTransactionParamContent {
    messages?: ConnectTransactionParamMessage[];
    items?: StructuredItem[];
    network?: ChainId;
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
        items: raw.items?.map(parseRawStructuredItem),
        network: raw.network,
        validUntil: raw.valid_until,
        from: raw.from,
    };
}

/**
 * Parse raw TON Connect sign data params to internal SignDataPayload format
 */
export function parseConnectSignDataParamContent(event: RawBridgeEventSignData): SignDataPayload | undefined {
    try {
        const parsed = JSON.parse(event.params[0]) as TonConnectSignDataPayload;

        const validationResult = validateSignDataPayload(parsed);
        if (validationResult) {
            return undefined;
        }

        if (parsed === undefined) {
            return undefined;
        }

        let signData: SignData;

        if (parsed.type === 'text') {
            signData = { type: 'text', value: { content: parsed.text } };
        } else if (parsed.type === 'binary') {
            signData = { type: 'binary', value: { content: parsed.bytes as Base64String } };
        } else if (parsed.type === 'cell') {
            signData = { type: 'cell', value: { schema: parsed.schema, content: parsed.cell as Base64String } };
        } else {
            return undefined;
        }

        return {
            network: parsed.network ? Network.custom(parsed.network) : undefined,
            fromAddress: parsed.from,
            data: signData,
        };
    } catch {
        return undefined;
    }
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
        messages: params.messages?.map(toTransactionRequestMessage) ?? [],
        items: params.items,
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
        items: request.items?.map(toRawStructuredItem),
        network: request.network?.chainId,
        valid_until: request.validUntil,
        from: request.fromAddress,
    };
}

export type RawBridgeEventTransaction = BridgeEvent & SendTransactionRpcRequest;
export type RawBridgeEventSignData = BridgeEvent & SignDataRpcRequest;

// TODO: Replace with BridgeEvent & SignMessageRpcRequest from @tonconnect/protocol once
// signMessage is standardized and added to the protocol package (currently absent in v2.4.0).
export interface RawBridgeEventSignMessage extends BridgeEvent {
    id: string;
    method: 'signMessage';
    params: [string]; // JSON-stringified, same format as sendTransaction params
    timestamp?: number;
}

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
    | RawBridgeEventSignMessage
    | RawBridgeEventDisconnect;

// Internal event routing types
export type EventType = 'connect' | 'sendTransaction' | 'signData' | 'signMessage' | 'disconnect' | 'restoreConnection';

export interface EventHandler<T extends BridgeEvent = BridgeEvent, V extends RawBridgeEvent = RawBridgeEvent> {
    canHandle(event: RawBridgeEvent): event is V;
    handle(event: V): Promise<T | WalletResponseTemplateError>;
    notify(event: T): Promise<void>;
}
