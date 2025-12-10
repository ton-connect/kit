/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NftItem } from '@ton/walletkit';

export const getNftImage = (item: NftItem): string | null => {
    if (item.metadata && typeof item.metadata === 'object') {
        if (item.metadata?.extra?._image_medium && typeof item.metadata.extra._image_medium === 'string') {
            return item.metadata.extra._image_medium;
        }
        if (item.metadata.image && typeof item.metadata.image === 'string') {
            return item.metadata.image;
        }
    }
    return null;
};

export const getNftName = (item: NftItem, formatNftIndex: (index: string) => string): string => {
    if (item.metadata && typeof item.metadata === 'object') {
        if (item.metadata.name && typeof item.metadata.name === 'string') {
            return item.metadata.name;
        }
    }
    return `NFT ${formatNftIndex(item.index)}`;
};

export const getNftDescription = (item: NftItem): string | null => {
    if (item.metadata && typeof item.metadata === 'object') {
        if (item.metadata.description && typeof item.metadata.description === 'string') {
            return item.metadata.description;
        }
    }
    return null;
};

export const getCollectionName = (item: NftItem): string | null => {
    if (item.collection && item.collection.name) {
        return item.collection.name;
    }

    if (
        item.collection?.collectionContent &&
        typeof (item.collection.collectionContent as Record<string, unknown>).name === 'string'
    ) {
        return (item.collection.collectionContent as Record<string, unknown>).name as string;
    }

    return null;
};

export const getCollectionDescription = (item: NftItem): string | null => {
    if (
        item.collection?.collectionContent &&
        typeof (item.collection.collectionContent as Record<string, unknown>).description === 'string'
    ) {
        return (item.collection.collectionContent as Record<string, unknown>).description as string;
    }
    return null;
};
