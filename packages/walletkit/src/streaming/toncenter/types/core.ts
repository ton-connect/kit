/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StreamingV2AccountStateNotification } from './account';
import type { StreamingV2JettonsNotification } from './jetton';
import type { StreamingV2TransactionsNotification, StreamingV2TraceInvalidatedNotification } from './transaction';

export type StreamingV2Finality = 'pending' | 'confirmed' | 'finalized';

export type StreamingV2EventType = 'transactions' | 'account_state_change' | 'jettons_change';

export interface StreamingV2SubscriptionRequest {
    addresses?: string[];
    trace_external_hash_norms?: string[];
    types: StreamingV2EventType[];
    min_finality?: StreamingV2Finality;
    include_address_book?: boolean;
    include_metadata?: boolean;
}

export type StreamingV2Event =
    | StreamingV2TransactionsNotification
    | StreamingV2TraceInvalidatedNotification
    | StreamingV2AccountStateNotification
    | StreamingV2JettonsNotification;
