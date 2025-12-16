/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress, Hex } from '../../api/models';
import type { NftCollection } from './NftCollection';
import type { TokenInfo } from './TokenInfo';

export interface NftItemAttribute {
    trait_type: string;
    value: string;
}

export interface NftItem {
    address: UserFriendlyAddress;
    auctionContractAddress: UserFriendlyAddress | null;
    codeHash: Hex | null;
    dataHash: Hex | null;
    collection: NftCollection | null;
    collectionAddress: UserFriendlyAddress | null;
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
    ownerAddress: UserFriendlyAddress | null;
    realOwner: UserFriendlyAddress | null;
    saleContractAddress: UserFriendlyAddress | null;
    attributes?: NftItemAttribute[];
}
