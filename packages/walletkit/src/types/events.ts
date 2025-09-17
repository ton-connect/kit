// Event type definitions for TON Connect protocol

import type {
    ConnectEventSuccess,
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
import { EmulationError } from './emulation/errors';

// export type EventConnectRequest = ConnectRequest;

/**
 * Connect request event from dApp
 */
export interface EventConnectRequest extends BridgeEventBase {
    request: ConnectRequest['items'];

    /** Preview information for UI display */
    preview: ConnectPreview;
}

/**
 * Transaction request event from dApp
 */
export type EventTransactionRequest = RawBridgeEventTransaction & {
    /** Raw transaction request data */
    request: ConnectTransactionParamContent;

    /** Human-readable preview for UI display */
    preview: TransactionPreview;

    error?: string;
};

/**
 * Sign data request event from dApp
 */
export interface EventSignDataRequest extends RawBridgeEventSignData {
    /** Raw data to be signed */
    request: SignDataPayload;

    /** Human-readable preview for UI display */
    preview: SignDataPreview;
}

/**
 * Disconnect event
 */
export interface EventDisconnect extends BridgeEventBase {
    /** Optional disconnect reason */
    reason?: string;

    walletAddress: string;
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

    requestedItems?: string[];
    permissions?: ConnectPermission[];
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
