// Event type definitions for TON Connect protocol

import type { ConnectRequest } from '@tonconnect/protocol';

import type { WalletInterface, TonNetwork } from './wallet';
import type { HumanReadableTx } from '../validation/transaction';
import { ConnectTransactionParamContent, RawBridgeEventTransaction } from './internal';

// export type EventConnectRequest = ConnectRequest;

/**
 * Connect request event from dApp
 */
export interface EventConnectRequest {
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
export interface TransactionPreview {
    /** Estimated total fees */
    totalFees?: string;

    /** Whether transaction might bounce */
    willBounce?: boolean;

    /** Balance before transaction */
    balanceBefore?: string;

    /** Estimated balance after transaction */
    balanceAfter?: string;

    /** Human-readable message descriptions */
    messages: HumanReadableTx[];
}

/**
 * Sign data request event from dApp
 */
export interface EventSignDataRequest {
    /** Unique request identifier */
    id: string;

    /** Raw data to be signed */
    data: Uint8Array;

    /** Human-readable preview for UI display */
    preview: SignDataPreview;

    /** Wallet that will handle this request */
    wallet: WalletInterface;
}

/**
 * Sign data preview information
 */
export interface SignDataPreview {
    /** Content type for display */
    kind: 'text' | 'json' | 'bytes';

    /** Human-readable content */
    content: string;

    /** Additional metadata */
    metadata?: {
        size: number;
        hash: string;
        encoding: string;
    };
}

/**
 * Disconnect event
 */
export interface EventDisconnect {
    /** Optional disconnect reason */
    reason?: string;

    /** Wallet associated with the disconnected session */
    wallet: WalletInterface;
}
