/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SignDataPayload } from '../core/PreparedSignData';
import type { TransactionRequest } from '../transactions/TransactionRequest';
import type { SendTransactionRequestEvent } from './SendTransactionRequestEvent';
import type { SignDataRequestEvent } from './SignDataRequestEvent';
import type { SignMessageRequestEvent } from './SignMessageRequestEvent';

/**
 * @discriminator method
 */
export type IntentAction = SendTransactionIntentAction | SignMessageIntentAction | SignDataIntentAction;

export interface SendTransactionIntentAction {
    method: 'sendTransaction';
    transactionRequest: TransactionRequest;
}

export interface SignMessageIntentAction {
    method: 'signMessage';
    transactionRequest: TransactionRequest;
}

export interface SignDataIntentAction {
    method: 'signData';
    payload: SignDataPayload;
}

declare const intentConnectionResultBrand: unique symbol;

/**
 * Opaque type holding the pre-built connection approval response.
 * Created by approveConnectRequest when an intent is present.
 * Passed through to the action approval method which attaches the action result and sends it.
 */
export type IntentConnectionResult = { readonly [intentConnectionResultBrand]: never };

/**
 * @discriminator type
 */
export type IntentActionRequestEvent =
    | IntentActionSendTransactionRequestEvent
    | IntentActionSignMessageRequestEvent
    | IntentActionSignDataRequestEvent;

export interface IntentActionSendTransactionRequestEvent extends SendTransactionRequestEvent {
    type: 'sendTransaction';

    /**
     * @discriminator frozen
     */
    connectionResult: IntentConnectionResult;
}

export interface IntentActionSignMessageRequestEvent extends SignMessageRequestEvent {
    type: 'signMessage';

    /**
     * @discriminator frozen
     */
    connectionResult: IntentConnectionResult;
}

export interface IntentActionSignDataRequestEvent extends SignDataRequestEvent {
    type: 'signData';

    /**
     * @discriminator frozen
     */
    connectionResult: IntentConnectionResult;
}
