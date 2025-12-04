/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Event type definitions for TON Connect protocol

import type {
    CONNECT_EVENT_ERROR_CODES,
    ConnectEventSuccess,
    ConnectItem,
    ConnectRequest,
    SignDataPayload,
    WalletResponseTemplateError,
} from '@tonconnect/protocol';

import {
    BridgeEventBase,
    ConnectTransactionParamContent,
    EventApprovalBase,
    RawBridgeEventSignData,
    RawBridgeEventTransaction,
    RawBridgeEvent,
} from './internal';
import { MoneyFlow } from '../utils/toncenterEmulation';
import { ToncenterEmulationResponse } from './toncenter/emulation';
import { Base64String, Hex } from './primitive';
import { ErrorInfo } from '../errors';

// export type EventConnectRequest = ConnectRequest;

export interface DAppInfo {
    name?: string;
    description?: string;
    url?: string;
    iconUrl?: string;
}

/**
 * Connect request event from dApp
 */
export interface EventConnectRequest extends BridgeEventBase {
    request: ConnectRequest['items'];

    /** Preview information for UI display */
    preview: ConnectPreview;

    /** dApp information */
    dAppInfo: DAppInfo;
}

/**
 * Transaction request event from dApp
 */
export type EventTransactionRequest = RawBridgeEventTransaction & {
    /** Raw transaction request data */
    request: ConnectTransactionParamContent;

    /** Human-readable preview for UI display */
    preview: TransactionPreview;

    /** dApp information */
    dAppInfo: DAppInfo;
};

export interface EventTransactionResponse {
    signedBoc: Base64String;
}

/**
 * Sign data request event from dApp
 */
export interface EventSignDataRequest extends RawBridgeEventSignData {
    /** Raw data to be signed */
    request: SignDataPayload;

    /** Human-readable preview for UI display */
    preview: SignDataPreview;

    /** dApp information */
    dAppInfo: DAppInfo;
}

export interface EventSignDataResponse {
    signature: Hex;
}

/**
 * Disconnect event
 */
export interface EventDisconnect extends BridgeEventBase {
    /** Optional disconnect reason */
    reason?: string;

    /** Wallet ID in format "network:address" (e.g., "-239:EQD...") */
    walletId: string;
    walletAddress?: string;

    /** dApp information */
    dAppInfo: DAppInfo;
}

export interface EventRequestError {
    incomingEvent: RawBridgeEvent;
    result: WalletResponseTemplateError;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EventRestoreConnectionRequest extends BridgeEventBase {}

export interface EventConnectApproval extends EventApprovalBase {
    result: ConnectApproval;
}

export interface ConnectApproval {
    dAppName: string;
    dAppUrl: string;
    dAppIconUrl: string;
    dAppDescription: string;

    from: string;

    response: ConnectEventSuccess;
}

export interface EventTransactionApproval extends EventApprovalBase {
    result: TransactionApproval;
}

export interface TransactionApproval {
    signedBoc: string;
}

export interface EventSignDataApproval extends EventApprovalBase {
    result: SignDataApproval;
}

export interface SignDataApproval {
    signature: string;
    address: string;
    timestamp: number;
    domain: string;
    payload: SignDataPayload;
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
    manifestUrl?: string;
    manifest?: {
        name?: string;
        description?: string;
        url?: string;
        iconUrl?: string;
    };

    requestedItems?: ConnectItem[];
    permissions?: ConnectPermission[];
    manifestFetchErrorCode?:
        | CONNECT_EVENT_ERROR_CODES.MANIFEST_NOT_FOUND_ERROR
        | CONNECT_EVENT_ERROR_CODES.MANIFEST_CONTENT_ERROR;
}

/**
 * Transaction preview for UI display
 */
export type TransactionPreview = TransactionPreviewEmulationError | TransactionPreviewEmulationResult;

export interface TransactionPreviewEmulationError {
    result: 'error';
    emulationError: ErrorInfo;
}

export interface TransactionPreviewEmulationResult {
    result: 'success';
    /** Estimated total fees */
    moneyFlow: MoneyFlow;
    /** Emulation result */
    emulationResult: ToncenterEmulationResponse;
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
