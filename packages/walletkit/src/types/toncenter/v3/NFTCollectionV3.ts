/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { NftCollection } from '../NftCollection';
import { asAddressFriendlySync, asMaybeAddressFriendlySync } from '../../primitive';
import { Base64ToHex } from '../../../utils/base64';

export interface NFTCollectionV3 {
    address: string;
    code_hash?: string;
    collection_content?: {
        uri?: string;
        [key: string]: unknown;
    };
    data_hash?: string;
    last_transaction_lt?: string;
    next_item_index: string;
    owner_address?: string;
}

export interface TokenInfoNFTCollection {
    type: 'nft_collections';
    valid: boolean;
    name: string;
    description: string;
    image: string;
    extra: {
        cover_image?: string;
        uri?: string;
        _image_big?: string;
        _image_medium?: string;
        _image_small?: string;
        [key: string]: unknown;
    };
}

export function toNftCollection(data: NFTCollectionV3 | null): NftCollection | null {
    if (!data) return null;
    const out: NftCollection = {
        address: asAddressFriendlySync(data.address),
        codeHash: data.code_hash ? Base64ToHex(data.code_hash) : null,
        dataHash: data.data_hash ? Base64ToHex(data.data_hash) : null,
        nextItemIndex: data.next_item_index.toString(),
        ownerAddress: asMaybeAddressFriendlySync(data.owner_address),
    };
    if (data.last_transaction_lt) out.lastTransactionLt = data.last_transaction_lt.toString();
    if (data.collection_content) out.collectionContent = data.collection_content;
    return out;
}

export function tokenMetaToNftCollection(address: string, data: TokenInfoNFTCollection): NftCollection | null {
    if (!data) return null;

    const image = data?.extra?._image_medium ?? data?.image;
    const out: NftCollection = {
        address: asAddressFriendlySync(address),
        name: data.name,
        description: data.description,
        image: image,
        extra: data.extra,
    };
    return out;
}
