/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StreamingV2AccountStateNotification } from './account';
import type { StreamingV2JettonsNotification } from './jetton';
import type {
    StreamingV2ActionsNotification,
    StreamingV2TraceInvalidatedNotification,
    StreamingV2TransactionsNotification,
    StreamingV2TraceNotification,
} from './transaction';

export type StreamingV2Finality = 'pending' | 'confirmed' | 'finalized';

export type StreamingV2EventType =
    | 'transactions'
    | 'actions'
    | 'trace'
    | 'account_state_change'
    | 'jettons_change'
    | 'trace_invalidated';

export interface StreamingV2SubscriptionRequest {
    addresses?: string[];
    trace_external_hash_norms?: string[];
    types: StreamingV2EventType[];
    min_finality?: StreamingV2Finality;
    include_address_book?: boolean;
    include_metadata?: boolean;
    action_types?: string[];
    supported_action_types?: string[];
}

export type StreamingV2Event =
    | StreamingV2TransactionsNotification
    | StreamingV2ActionsNotification
    | StreamingV2AccountStateNotification
    | StreamingV2JettonsNotification
    | StreamingV2TraceNotification
    | StreamingV2TraceInvalidatedNotification;
