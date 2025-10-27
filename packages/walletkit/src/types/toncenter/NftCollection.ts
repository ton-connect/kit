/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AddressFriendly, Hex } from '../primitive';

export interface NftCollection {
    address: AddressFriendly;
    codeHash: Hex | null;
    collectionContent?: { [key: string]: never };
    dataHash: Hex | null;
    lastTransactionLt?: bigint;
    nextItemIndex: bigint;
    ownerAddress: AddressFriendly | null;
}
