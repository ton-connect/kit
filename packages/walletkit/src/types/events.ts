// Event type definitions for TON Connect protocol

import type { ConnectRequest, SignDataPayload } from '@tonconnect/protocol';

import type { WalletInterface, TonNetwork } from './wallet';
import {
    BridgeEventBase,
    ConnectTransactionParamContent,
    RawBridgeEventSignData,
    RawBridgeEventTransaction,
} from './internal';
import { MoneyFlow } from '../utils/toncenterEmulation';
import { ToncenterEmulationResponse } from './toncenter/emulation';
import { EmulationError } from './emulation/errors';

// export type EventConnectRequest = ConnectRequest;

/**
 * Connect request event from dApp
 */
export interface EventConnectRequest extends BridgeEventBase {
    /** Unique request identifier */
    id: string;

    /** dApp display name */
    dAppName: string;
    dAppUrl: string;

    /** URL to dApp manifest */
    manifestUrl: string;

    request: ConnectRequest['items'];

    /** Preview information for UI display */
    preview: ConnectPreview;

    /** Wallet that will handle this request */
    wallet?: WalletInterface;

    isJsBridge?: boolean;
    tabId?: number;
}

export interface EventRestoreConnectionRequest {
    /** Unique request identifier */
    id: string;
}

export interface ConnectPermission {
    name: string;
    title: string;
    description: string;
}

/**
 * Connect request preview information
 */
export interface ConnectPreview {
    manifest?: {
        name: string;
        description?: string;
        url?: string;
        iconUrl?: string;
    };
    requestedItems?: string[];
    permissions?: ConnectPermission[];
}

/**
 * Transaction request event from dApp
 */

export type EventTransactionRequest = RawBridgeEventTransaction & {
    /** Unique request identifier */
    id: string;

    /** Raw transaction request data */
    request: ConnectTransactionParamContent;

    /** Human-readable preview for UI display */
    preview: TransactionPreview;

    /** Wallet that will handle this request */
    wallet: WalletInterface;
};

/**
 * Raw transaction request data
 */
export interface TransactionRequest {
    /** Sender address */
    from: string;

    /** Target network */
    network: TonNetwork;

    /** Transaction validity timestamp */
    validUntil: number;

    /** Array of message BOCs */
    messages: string[];
}

/**
 * Transaction preview for UI display
 */
export type TransactionPreview = TransactionPreviewEmulationError | TransactionPreviewEmulationResult;

export interface TransactionPreviewEmulationError {
    result: 'error';
    emulationError: EmulationError;
}

export interface TransactionPreviewEmulationResult {
    result: 'success';
    /** Estimated total fees */
    moneyFlow: MoneyFlow;
    /** Emulation result */
    emulationResult: ToncenterEmulationResponse;
}

/**
 * Sign data request event from dApp
 */
export interface EventSignDataRequest extends RawBridgeEventSignData {
    from: string;
    /** Unique request identifier */
    id: string;

    /** Raw data to be signed */
    data: SignDataPayload;

    /** Human-readable preview for UI display */
    preview: SignDataPreview;

    /** Wallet that will handle this request */
    wallet: WalletInterface;
}

export type SignDataPreviewText = {
    kind: 'text';
    content: string;
};
export type SignDataPreviewBinary = {
    kind: 'binary';
    content: string;
};
export type SignDataPreviewCell = {
    kind: 'cell';
    content: string;
    schema?: string;
    parsed?: Record<string, unknown>;
};
export type SignDataPreview = SignDataPreviewText | SignDataPreviewBinary | SignDataPreviewCell;

/**
 * Disconnect event
 */
export interface EventDisconnect {
    /** Optional disconnect reason */
    reason?: string;

    /** Wallet associated with the disconnected session */
    wallet: WalletInterface;
}
