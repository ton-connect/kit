/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Structured item types for sendTransaction/signMessage with items instead of raw messages

import type { Base64String } from '../core/Primitives';
import type { ExtraCurrencies } from '../core/ExtraCurrencies';

export type StructuredItemType = 'ton' | 'jetton' | 'nft';

/**
 * @discriminator type
 */
export type StructuredItem = TonTransferItem | JettonTransferItem | NftTransferItem;

export interface TonTransferItem {
    type: 'ton';
    address: string;
    amount: string;
    payload?: Base64String;
    stateInit?: Base64String;
    extraCurrency?: ExtraCurrencies;
}

export interface JettonTransferItem {
    type: 'jetton';
    master: string;
    destination: string;
    amount: string;
    attachAmount?: string;
    responseDestination?: string;
    customPayload?: Base64String;
    forwardAmount?: string;
    forwardPayload?: Base64String;
}

export interface NftTransferItem {
    type: 'nft';
    nftAddress: string;
    newOwner: string;
    attachAmount?: string;
    responseDestination?: string;
    customPayload?: Base64String;
    forwardAmount?: string;
    forwardPayload?: Base64String;
}
