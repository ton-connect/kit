/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NftItemV3 } from './NftItemV3';
import { AddressBookRowV3 } from './AddressBookRowV3';
import { AddressMetadataV3 } from './AddressMetadataV3';
import { NftItemsResponse } from '../NftItemsResponse';
import { toNftItem } from './NftItemV3';
import { asAddressFriendly } from '../../primitive';
import { toTokenInfo } from './NftTokenInfoV3';
import { Pagination } from '../Pagination';
import { NftMetadata } from '../NftMetadata';

export interface NftItemsResponseV3 {
    address_book?: { [key: string]: AddressBookRowV3 };
    metadata?: { [key: string]: AddressMetadataV3 };
    nft_items?: NftItemV3[];
}

export function toNftItemsResponse(data: NftItemsResponseV3, pagination: Pagination): NftItemsResponse {
    const metadata: NftMetadata = {};
    if (data.metadata) {
        for (const address of Object.keys(data.metadata)) {
            metadata[asAddressFriendly(address)] = {
                isIndexed: data.metadata[address].is_indexed,
                tokenInfo: (data.metadata[address].token_info ?? []).map(toTokenInfo),
            };
        }
    }
    const out: NftItemsResponse = {
        addressBook: {},
        metadata,
        items: (data.nft_items ?? []).map((data) => {
            const item = toNftItem(data);
            const meta = metadata[item.address];
            if (meta) {
                const tokenInfo = meta.tokenInfo.filter((it) => it.valid);
                if (tokenInfo.length > 0) {
                    item.metadata = tokenInfo[0];
                }
            }
            return item;
        }),
        pagination,
    };
    if (out.items.length === 0) {
        out.pagination.pages = 0;
    }
    if (data.address_book) {
        for (const address of Object.keys(data.address_book)) {
            out.addressBook[asAddressFriendly(address)] = {
                domain: data.address_book[address].domain,
            };
        }
    }
    return out;
}
