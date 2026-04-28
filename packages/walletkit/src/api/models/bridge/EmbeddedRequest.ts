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
export type EmbeddedRequest = SendTransactionEmbeddedRequest | SignMessageEmbeddedRequest | SignDataEmbeddedRequest;

export interface SendTransactionEmbeddedRequest {
    method: 'sendTransaction';
    transactionRequest: TransactionRequest;
}

export interface SignMessageEmbeddedRequest {
    method: 'signMessage';
    transactionRequest: TransactionRequest;
}

export interface SignDataEmbeddedRequest {
    method: 'signData';
    payload: SignDataPayload;
}

declare const embeddedConnectionResultBrand: unique symbol;

/**
 * Opaque type holding the pre-built connection approval response.
 * Created by approveConnectRequest when an embedded request is present.
 * Passed through to the action approval method which attaches the action result and sends it.
 */
export type EmbeddedConnectionResult = { readonly [embeddedConnectionResultBrand]: never };

/**
 * @discriminator type
 */
export type EmbeddedRequestEvent =
    | EmbeddedSendTransactionRequestEvent
    | EmbeddedSignMessageRequestEvent
    | EmbeddedSignDataRequestEvent;

export interface EmbeddedSendTransactionRequestEvent extends SendTransactionRequestEvent {
    type: 'sendTransaction';

    /**
     * @frozen
     */
    connectionResult: EmbeddedConnectionResult;
}

export interface EmbeddedSignMessageRequestEvent extends SignMessageRequestEvent {
    type: 'signMessage';

    /**
     * @frozen
     */
    connectionResult: EmbeddedConnectionResult;
}

export interface EmbeddedSignDataRequestEvent extends SignDataRequestEvent {
    type: 'signData';

    /**
     * @frozen
     */
    connectionResult: EmbeddedConnectionResult;
}
