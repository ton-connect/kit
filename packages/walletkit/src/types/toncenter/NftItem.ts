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

export interface NftItem {
    address: AddressFriendly;
    auctionContractAddress: AddressFriendly | null;
    codeHash: Hex | null;
    dataHash: Hex | null;
    collection: NftCollection | null;
    collectionAddress: AddressFriendly | null;
    content?: { [key: string]: never };
    metadata?: TokenInfo;
    index: bigint;
    init: boolean;
    lastTransactionLt?: bigint;
    onSale: boolean;
    ownerAddress: AddressFriendly | null;
    realOwner: AddressFriendly | null;
    saleContractAddress: AddressFriendly | null;
}
