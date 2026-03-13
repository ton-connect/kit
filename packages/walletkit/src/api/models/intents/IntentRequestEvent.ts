/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BridgeEvent } from '../bridge/BridgeEvent';
import type { ConnectionRequestEvent } from '../bridge/ConnectionRequestEvent';
import type { TransactionRequest } from '../transactions/TransactionRequest';
import type { TransactionEmulatedPreview } from '../transactions/emulation/TransactionEmulatedPreview';
import type { SignDataPayload } from '../core/PreparedSignData';
import type { DAppInfo } from '../core/DAppInfo';
import type { Network } from '../core/Network';
import type { IntentActionItem } from './IntentActionItem';

/**
 * Origin of the intent request.
 */
export type IntentOrigin = 'deepLink' | 'objectStorage' | 'bridge' | 'jsBridge' | 'connectedBridge';

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
}

/**
 * Transaction intent request event.
 *
 * Covers both `txDraft` (send) and `signMsgDraft` (signOnly) from the spec.
 * The `deliveryMode` field distinguishes them.
 */
export interface TransactionIntentRequestEvent extends IntentRequestBase {
    type: 'transaction';
    /** Whether to send on-chain or return signed BoC */
    deliveryMode: IntentDeliveryMode;
    /** Network for the transaction */
    network?: Network;
    /**
     * Transaction validity deadline (unix timestamp)
     * @format timestamp
     */
    validUntil?: number;
    /** Original intent action items (for display / re-conversion) */
    items: IntentActionItem[];
    /** Resolved transaction request (items converted to messages) */
    resolvedTransaction?: TransactionRequest;
    /** Emulated preview for display */
    preview?: TransactionEmulatedPreview;
}

/**
 * Sign data intent request event.
 */
export interface SignDataIntentRequestEvent extends IntentRequestBase {
    type: 'signData';
    /** Network for sign data */
    network?: Network;
    /**
     * Manifest URL (for domain binding)
     * @format url
     */
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
    type: 'action';
    /**
     * Action URL to fetch
     * @format url
     */
    actionUrl?: string;
    /**
     * Optional action type.
     */
    actionType?: string;
}

/**
 * Connect intent request event, wrapping a ConnectionRequestEvent
 * when an intent URL also carries a connect request.
 */
export interface ConnectIntentRequestEvent extends ConnectionRequestEvent {
    type: 'connect';
}

/**
 * Union of all intent request events, discriminated by `type`.
 *
 * The `connect` variant is used when an intent URL carries a connect request.
 * It appears as the first item in a {@link BatchedIntentEvent} so the wallet
 * can display it alongside the transaction/sign-data items.
 * @discriminator type
 */
export type IntentRequestEvent =
    | TransactionIntentRequestEvent
    | SignDataIntentRequestEvent
    | ActionIntentRequestEvent
    | ConnectIntentRequestEvent;
