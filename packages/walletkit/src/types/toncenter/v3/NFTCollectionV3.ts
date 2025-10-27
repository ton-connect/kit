/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { NftCollection } from '../NftCollection';
import { asAddressFriendly, asMaybeAddressFriendly } from '../../primitive';
import { Base64ToHex } from '../../../utils/base64';

export interface NFTCollectionV3 {
    address: string;
    code_hash?: string;
    collection_content?: { [key: string]: never };
    data_hash?: string;
    last_transaction_lt?: string;
    next_item_index: string;
    owner_address?: string;
}

export function toNftCollection(data: NFTCollectionV3 | null): NftCollection | null {
    if (!data) return null;
    const out: NftCollection = {
        address: asAddressFriendly(data.address),
        codeHash: data.code_hash ? Base64ToHex(data.code_hash) : null,
        dataHash: data.data_hash ? Base64ToHex(data.data_hash) : null,
        nextItemIndex: BigInt(data.next_item_index),
        ownerAddress: asMaybeAddressFriendly(data.owner_address),
    };
    if (data.last_transaction_lt) out.lastTransactionLt = BigInt(data.last_transaction_lt);
    if (data.collection_content) out.collectionContent = data.collection_content;
    return out;
}
