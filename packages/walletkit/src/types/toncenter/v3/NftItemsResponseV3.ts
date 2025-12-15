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
import { AddressFriendly, asAddressFriendlySync } from '../../primitive';
import { toTokenInfo } from './NftTokenInfoV3';
import { Pagination } from '../Pagination';
import { NftMetadata } from '../NftMetadata';
import { NftCollection } from '../NftCollection';
import { tokenMetaToNftCollection } from './NFTCollectionV3';

export interface NftItemsResponseV3 {
    address_book?: { [key: string]: AddressBookRowV3 };
    metadata?: { [key: string]: AddressMetadataV3 };
    nft_items?: NftItemV3[];
}

export function toNftItemsResponse(data: NftItemsResponseV3, pagination: Pagination): NftItemsResponse {
    const metadata: NftMetadata = {};
    const collections: { [key: AddressFriendly]: NftCollection } = {};
    if (data.metadata) {
        for (const address of Object.keys(data.metadata)) {
            if (!data.metadata[address].token_info || data.metadata[address].token_info.length === 0) {
                continue;
            }
            const tokenInfo = data.metadata[address].token_info[0];
            if (tokenInfo.type === 'nft_items') {
                metadata[asAddressFriendlySync(address)] = {
                    isIndexed: data.metadata[address].is_indexed,
                    tokenInfo: [toTokenInfo(tokenInfo)],
                };
            } else if (tokenInfo.type === 'nft_collections') {
                const collection = tokenMetaToNftCollection(address, tokenInfo);
                if (collection) {
                    collections[asAddressFriendlySync(address)] = collection;
                }
            }
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
            const itemCollection = item.collection;
            const itemCollectionMeta = item.collectionAddress
                ? collections[asAddressFriendlySync(item.collectionAddress)]
                : undefined;

            if (itemCollection || itemCollectionMeta) {
                item.collection = {
                    ...itemCollection,
                    ...itemCollectionMeta,
                } as NftCollection;
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
            out.addressBook[asAddressFriendlySync(address)] = {
                domain: data.address_book[address].domain,
            };
        }
    }
    return out;
}
