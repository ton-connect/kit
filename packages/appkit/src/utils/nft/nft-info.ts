/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFT } from '@ton/walletkit';

import { middleEllipsis } from '../string/middle-ellipsis';

export const getNftImage = (nft: NFT): string | null => {
    if (!nft.info?.image) return null;

    const { url, data, mediumUrl, smallUrl, largeUrl } = nft.info.image;

    if (url) return url;
    if (mediumUrl) return mediumUrl;
    if (largeUrl) return largeUrl;
    if (smallUrl) return smallUrl;

    if (data) {
        try {
            return atob(data);
        } catch {
            return null;
        }
    }

    return null;
};

export const getNftName = (nft: NFT): string => {
    if (nft.info?.name) return nft.info.name;
    if (nft.index) return `NFT #${nft.index}`;
    return middleEllipsis(nft.address);
};

export const getCollectionName = (nft: NFT): string => {
    return nft.collection?.name || 'Unknown Collection';
};

export const getFormattedNftInfo = (nft: NFT) => {
    const nftName = getNftName(nft);
    const nftImage = getNftImage(nft);
    const collectionName = getCollectionName(nft);

    return {
        address: nft.address,
        collectionName,
        name: nftName,
        image: nftImage,
        isOnSale: nft.isOnSale,
    };
};
