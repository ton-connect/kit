/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { asAddressFriendly, asMaybeAddressFriendly } from '../../primitive';
import { Base64ToHex } from '../../../utils/base64';
import type { NFTCollection } from '../../../api/models';

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

export function toNftCollection(address: string | null, data: NFTCollectionV3 | null): NFTCollection | null {
    if (!data) {
        if (address) {
            return { address: asAddressFriendly(address) };
        } else {
            return null;
        }
    }
    const out: NFTCollection = {
        address: asAddressFriendly(data.address),
        codeHash: data.code_hash ? Base64ToHex(data.code_hash) : undefined,
        dataHash: data.data_hash ? Base64ToHex(data.data_hash) : undefined,
        nextItemIndex: data.next_item_index.toString(),
        ownerAddress: asMaybeAddressFriendly(data.owner_address) ?? undefined,
    };
    if (data.collection_content) out.extra = data.collection_content;
    return out;
}

export function tokenMetaToNftCollection(address: string, data: TokenInfoNFTCollection): NFTCollection | null {
    if (!data) {
        return { address: asAddressFriendly(address) };
    }

    const image = data?.extra?.cover_image ?? data?.image;
    const out: NFTCollection = {
        address: asAddressFriendly(address),
        name: data.name,
        description: data.description,
        image: {
            url: image,
            smallUrl: data?.extra?._image_small,
            mediumUrl: data?.extra?._image_medium,
            largeUrl: data?.extra?._image_big,
        },
        extra: data.extra,
    };
    return out;
}
