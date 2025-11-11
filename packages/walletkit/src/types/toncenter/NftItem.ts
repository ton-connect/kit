/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AddressFriendly, Hex } from '../primitive';
import type { NftCollection } from './NftCollection';
import { TokenInfo } from './TokenInfo';

export interface NftItemAttribute {
    trait_type: string;
    value: string;
}

export interface NftItem {
    address: AddressFriendly;
    auctionContractAddress: AddressFriendly | null;
    codeHash: Hex | null;
    dataHash: Hex | null;
    collection: NftCollection | null;
    collectionAddress: AddressFriendly | null;
    content?: {
        uri?: string;
        [key: string]: unknown;
    };
    metadata?: TokenInfo;
    index: string;
    init: boolean;
    isSbt?: boolean;
    lastTransactionLt?: string;
    onSale: boolean;
    ownerAddress: AddressFriendly | null;
    realOwner: AddressFriendly | null;
    saleContractAddress: AddressFriendly | null;
    attributes?: NftItemAttribute[];
}
