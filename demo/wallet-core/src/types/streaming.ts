/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Action } from '@ton/walletkit';

/** Streaming API v2 address book row */
export interface StreamingAddressBookRow {
    user_friendly?: string;
    domain?: string | null;
    interfaces?: string[];
}

/** Streaming API v2 address book (keyed by raw address) */
export type StreamingAddressBook = Record<string, StreamingAddressBookRow>;

/** Token info extra fields from streaming metadata */
export interface StreamingTokenInfoExtra {
    decimals?: string;
    _image_small?: string;
    _image_medium?: string;
    _image_big?: string;
    image?: string;
}

/** Token info from streaming metadata */
export interface StreamingTokenInfo {
    type?: string;
    symbol?: string;
    name?: string;
    extra?: StreamingTokenInfoExtra;
}

/** Address metadata from streaming API (keyed by raw address) */
export interface StreamingAddressMetadata {
    is_indexed?: boolean;
    token_info?: StreamingTokenInfo[];
}

/** Streaming API v2 metadata (keyed by raw address) */
export type StreamingMetadata = Record<string, StreamingAddressMetadata>;

/** Jetton transfer action details from streaming API */
export interface StreamingJettonTransferDetails {
    amount?: string;
    asset?: string;
    sender?: string;
    receiver?: string;
    sender_jetton_wallet?: string;
    receiver_jetton_wallet?: string;
    comment?: string | null;
}

/** Raw action from streaming API actions event */
export interface StreamingActionRaw {
    type?: string;
    details?: StreamingJettonTransferDetails;
    accounts?: string[];
}

/** Account for simplePreview (matches walletkit Account shape) */
export interface StreamingAccount {
    address: string;
    isScam: boolean;
    isWallet: boolean;
}

/** Preview for pending transaction (from transaction event) */
export interface StreamingTransactionPreview {
    type: 'send' | 'receive' | 'contract';
    amount: string;
    address: string;
    timestamp: number;
}

/** Pending transaction from WebSocket streaming */
export interface PendingTransaction {
    /** trace_external_hash_norm from WebSocket (external msg hash) */
    traceId: string;
    /** First tx hash (trace_id) - for dedup with events API */
    traceIdFromFirstTx?: string;
    externalHash?: string;
    preview?: StreamingTransactionPreview;
    /** Parsed action from trace (jetton/TON/etc) - used when available for correct display */
    action?: Action;
    /** Set when WebSocket reports confirmed/finalized - show as done, not pending */
    finality?: 'pending' | 'confirmed' | 'finalized' | 'invalidated';
}
