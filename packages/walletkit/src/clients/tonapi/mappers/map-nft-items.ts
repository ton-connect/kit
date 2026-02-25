/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFT, NFTsResponse } from '../../../api/models';
import type { AddressBookEntry } from '../../../api/models/core/AddressBook';
import { asAddressFriendly } from '../../../utils/address';
import type { TonApiNftItem } from '../types/nfts';

export function mapNftItem(item: TonApiNftItem): NFT {
    const isVerified = item.trust === 'whitelist' || item.verified;

    const nft: NFT = {
        address: asAddressFriendly(item.address),
        index: item.index.toString(),
        ownerAddress: item.owner ? asAddressFriendly(item.owner.address) : undefined,
        collection: item.collection
            ? {
                  address: asAddressFriendly(item.collection.address),
                  name: item.collection.name,
                  description: item.collection.description,
              }
            : undefined,
        info: {
            name: item.metadata.name ?? '',
            description: item.metadata.description ?? '',
            image: {
                url: item.metadata.image ?? '',
            },
        },
        attributes: item.metadata.attributes?.map((attr) => ({
            traitType: attr.trait_type,
            value: attr.value,
        })),
        extra: {
            isVerified,
            contentUrl: item.metadata.content_url,
            previews: item.previews,
            approvedBy: item.approved_by,
        },
    };

    return nft;
}

export function mapNftItemsResponse(items: TonApiNftItem[]): NFTsResponse {
    const addressBook: Record<string, AddressBookEntry> = {};

    items.forEach((item) => {
        if (item.owner) {
            const address = asAddressFriendly(item.owner.address);
            if (!addressBook[address]) {
                addressBook[address] = {
                    address: address,
                    domain: item.owner.name ?? undefined,
                    interfaces: [],
                };
            }
        }
    });

    return {
        addressBook,
        nfts: items.map(mapNftItem),
    };
}
