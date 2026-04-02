/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AddressBookRowV3 } from '../../../types/toncenter/v3/AddressBookRowV3';
import type { StreamingV2Finality } from './core';

export interface StreamingV2JettonWallet {
    address: string;
    balance: string;
    owner: string;
    jetton: string;
    last_transaction_lt: string;
    code_hash?: string;
    data_hash?: string;
}

export interface StreamingV2JettonTokenInfo {
    valid: boolean;
    type: string;
    name?: string;
    symbol?: string;
    description?: string;
    image?: string;
    extra?: {
        decimals?: string;
        uri?: string;
        [key: string]: unknown;
    };
}

export interface StreamingV2JettonMetadata {
    is_indexed: boolean;
    token_info?: StreamingV2JettonTokenInfo[];
    [key: string]: unknown;
}

export interface StreamingV2JettonsNotification {
    type: 'jettons_change';
    finality: StreamingV2Finality;
    jetton: StreamingV2JettonWallet;
    address_book?: Record<string, AddressBookRowV3>;
    metadata?: Record<string, StreamingV2JettonMetadata>;
}
