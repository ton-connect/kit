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
import type { Network } from '../core/Network';
import type { IntentActionItem } from './IntentActionItem';

/**
 * Origin of the intent request.
 */
export type IntentOrigin = 'deepLink' | 'objectStorage' | 'bridge' | 'jsBridge';

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
    /**
     * Action URL to fetch
     * @format url
     */
    actionUrl: string;
}

/**
 * Union of all intent request events, discriminated by `type`.
 */
export type IntentRequestEvent =
    | { type: 'transaction'; value: TransactionIntentRequestEvent }
    | { type: 'signData'; value: SignDataIntentRequestEvent }
    | { type: 'action'; value: ActionIntentRequestEvent };
