/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFTCollectionV3 } from './NFTCollectionV3';
import { asAddressFriendly, asMaybeAddressFriendly, Base64ToHex } from '../../../utils';
import { toNftCollection } from './NFTCollectionV3';
import type { NFT } from '../../../api/models';

export interface NftItemV3 {
    address: string;
    auction_contract_address: string;
    code_hash?: string;
    collection: NFTCollectionV3 | null;
    collection_address: string | null;
    content?: {
        uri?: string;
        [key: string]: unknown;
    };
    data_hash?: string;
    index: string;
    init: boolean;
    is_sbt?: boolean;
    last_transaction_lt?: string;
    on_sale: boolean;
    owner_address?: string;
    real_owner?: string;
    sale_contract_address?: string;
}

export function toNftItem(data: NftItemV3): NFT {
    const out: NFT = {
        address: asAddressFriendly(data.address),
        index: data.index.toString(),
        collection: toNftCollection(data.collection_address, data.collection) ?? undefined,
        auctionContractAddress: asMaybeAddressFriendly(data.auction_contract_address) ?? undefined,
        ownerAddress: asMaybeAddressFriendly(data.owner_address) ?? undefined,
        realOwnerAddress: asMaybeAddressFriendly(data.real_owner) ?? undefined,
        saleContractAddress: asMaybeAddressFriendly(data.sale_contract_address) ?? undefined,
        codeHash: data.code_hash ? Base64ToHex(data.code_hash) : undefined,
        dataHash: data.data_hash ? Base64ToHex(data.data_hash) : undefined,
        isInited: data.init,
        isSoulbound: data.is_sbt,
        isOnSale: data.on_sale,
    };
    if (data.content) out.extra = data.content;
    return out;
}
