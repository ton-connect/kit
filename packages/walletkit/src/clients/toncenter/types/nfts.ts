/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex, UserFriendlyAddress, TokenInfo as APITokenInfo } from '../../../api/models';

export interface Pagination {
    offset: number;
    limit: number;
    pages?: number;
}

export interface AddressBookRow {
    domain: string | null;
}

export interface NftItemAttribute {
    trait_type: string;
    value: string;
}

export interface TokenInfo {
    description?: string;
    extra?: {
        attributes?: NftItemAttribute[];
        lottie?: string;
        uri?: string;
        _image_big?: string;
        _image_medium?: string;
        _image_small?: string;
        animation_url?: string;
        content_url?: string;
        [key: string]: unknown;
    };
    image?: string;
    lottie?: string;
    name?: string;
    symbol?: string;
    type?: string;
    valid?: boolean;
    animation?: string;
}

export function toApiTokenInfo(data: TokenInfo): APITokenInfo {
    let lottie: string | undefined;
    let animationUrl: string | undefined;

    if (data?.extra?.animation_url) {
        animationUrl = data.extra.animation_url;
    } else if (data?.extra?.content_url && data.extra.content_url.includes('mp4')) {
        animationUrl = data.extra.content_url;
    }

    if (data.lottie) {
        lottie = data.lottie;
    } else if (data.extra && typeof data.extra === 'object' && 'lottie' in data.extra) {
        const lottieValue = (data.extra as Record<string, unknown>).lottie;
        if (typeof lottieValue === 'string') {
            lottie = lottieValue;
        }
    }

    return {
        name: data.name,
        description: data.description,
        image: {
            url: data.image ?? data.extra?._image_medium,
            smallUrl: data.extra?._image_small,
            mediumUrl: data.extra?._image_medium,
            largeUrl: data.extra?._image_big,
        },
        animation: {
            url: animationUrl,
            lottie: lottie,
        },
        symbol: data.symbol,
    };
}

export interface NftCollection {
    address: UserFriendlyAddress;
    collectionContent?: {
        uri?: string;
        [key: string]: unknown;
    };
    lastTransactionLt?: string;
    name?: string;
    nextItemIndex?: string;
    ownerAddress?: UserFriendlyAddress | null;
    codeHash?: Hex | null;
    dataHash?: Hex | null;
    description?: string;
    image?: string;
    extra?: {
        cover_image?: string;
        uri?: string;
        _image_big?: string;
        _image_medium?: string;
        _image_small?: string;
        [key: string]: unknown;
    };
}

export interface AddressMetadata {
    isIndexed: boolean;
    tokenInfo: TokenInfo[];
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

export type NftMetadata = { [key: UserFriendlyAddress]: AddressMetadata };

export interface NftItems {
    items: NftItem[];
    pagination: Pagination;
}

export interface NftItemsResponse extends NftItems {
    addressBook: { [key: UserFriendlyAddress]: AddressBookRow };
    metadata: NftMetadata;
}

export interface NftCollections {
    addressBook?: { [key: string]: AddressBookRow };
    metadata?: { [key: string]: AddressMetadata };
    nftCollections?: NftCollection[];
}
