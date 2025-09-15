// Event type definitions for TON Connect protocol

import type { ConnectRequest, SignDataPayload } from '@tonconnect/protocol';

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
export interface EventDisconnect {
    /** Optional disconnect reason */
    reason?: string;

    walletAddress: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EventRestoreConnectionRequest extends BridgeEventBase {}

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

    /** dApp display name */
    dAppName: string;
    dAppUrl: string;
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
