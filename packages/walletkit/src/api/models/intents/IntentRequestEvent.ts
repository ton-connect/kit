/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BridgeEvent } from '../bridge/BridgeEvent';
import type { TransactionRequest } from '../transactions/TransactionRequest';
import type { TransactionEmulatedPreview } from '../transactions/emulation/TransactionEmulatedPreview';
import type { SignDataPayload } from '../core/PreparedSignData';
import type { DAppInfo } from '../core/DAppInfo';
import type { IntentActionItem } from './IntentActionItem';

/**
 * Origin of the intent request.
 */
export type IntentOrigin = 'deepLink' | 'bridge' | 'jsBridge';

/**
 * Delivery mode for the signed transaction.
 */
export type IntentDeliveryMode = 'send' | 'signOnly';

/**
 * Base fields common to all intent request events.
 */
export interface IntentRequestBase extends BridgeEvent {
    /** How the request reached the wallet */
    origin: IntentOrigin;
    /** Client public key (for response encryption) */
    clientId?: string;
    /** Whether a connect flow should follow after intent approval */
    hasConnectRequest: boolean;
}

/**
 * Transaction intent request event.
 *
 * Covers both `txIntent` (send) and `signMsg` (signOnly) from the spec.
 * The `deliveryMode` field distinguishes them.
 */
export interface TransactionIntentRequestEvent extends IntentRequestBase {
    /** Event type discriminator */
    intentType: 'transaction';
    /** Whether to send on-chain or return signed BoC */
    deliveryMode: IntentDeliveryMode;
    /** Network chain ID ("-239" = mainnet, "-3" = testnet) */
    network?: string;
    /** Transaction validity deadline (unix timestamp) */
    validUntil?: number;
    /** Original intent action items (for display / re-conversion) */
    items: IntentActionItem[];
    /** Resolved transaction request (items converted to messages) */
    resolvedTransaction?: TransactionRequest;
    /** Emulated preview for display */
    preview?: TransactionIntentPreview;
}

/**
 * Preview data for transaction intent.
 */
export interface TransactionIntentPreview {
    /** Emulated transaction data */
    data?: TransactionEmulatedPreview;
}

/**
 * Sign data intent request event.
 */
export interface SignDataIntentRequestEvent extends IntentRequestBase {
    /** Event type discriminator */
    intentType: 'signData';
    /** Network chain ID */
    network?: string;
    /** Manifest URL (for domain binding) */
    manifestUrl: string;
    /** The data to sign */
    payload: SignDataPayload;
    /** dApp information resolved from manifest */
    dAppInfo?: DAppInfo;
}

/**
 * Action intent request event.
 *
 * The wallet fetches the action URL, which returns either a transaction
 * or sign-data action. This is an intermediate step before resolving
 * to a TransactionIntentRequestEvent or SignDataIntentRequestEvent.
 */
export interface ActionIntentRequestEvent extends IntentRequestBase {
    /** Event type discriminator */
    intentType: 'action';
    /** Action URL to fetch */
    actionUrl: string;
}

/**
 * Union of all intent request events, discriminated by `intentType`.
 */
export type IntentRequestEvent = TransactionIntentRequestEvent | SignDataIntentRequestEvent | ActionIntentRequestEvent;
