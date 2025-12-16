/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFT } from '@ton/walletkit';

export const getNftImage = (nft: NFT): string | undefined => {
    if (!nft?.info?.image) {
        return;
    }

    return (
        nft.info.image.url ||
        nft.info.image.data ||
        nft.info.image.mediumUrl ||
        nft.info.image.largeUrl ||
        nft.info.image.smallUrl
    );
};

export const getNftName = (nft: NFT, formatNftIndex: (index: string) => string): string => {
    if (nft.info?.name) {
        return nft.info.name;
    }

    if (nft.index) {
        return `NFT ${formatNftIndex(nft.index)}`;
    }

    return '';
};

export const getNftDescription = (nft: NFT): string | null => {
    if (nft.info?.description) {
        return nft.info.description;
    }

    return null;
};

export const getCollectionName = (item: NFT): string | null => {
    if (item.collection && item.collection.name) {
        return item.collection.name;
    }

    return null;
};

export const getCollectionDescription = (item: NFT): string | null => {
    if (item.collection && item.collection.description) {
        return item.collection.description;
    }

    return null;
};
