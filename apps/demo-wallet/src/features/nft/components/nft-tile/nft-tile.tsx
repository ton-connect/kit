/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import type { NFT } from '@ton/walletkit';

import { FallbackImage } from '@/core/components/ui/fallback-image';
import { Skeleton } from '@/core/components/ui/skeleton';
import { tokenImageUrls } from '@/core/utils';

const getNftImageSources = (nft: NFT): string[] => {
    const img = nft.info?.image;
    if (!img) return [];
    return [...tokenImageUrls(img), ...(img.data ? [`data:image/png;base64,${img.data}`] : [])];
};

const getNftName = (nft: NFT, formatNftIndex: (index: string) => string): string => {
    if (nft.info?.name) return nft.info.name;
    if (nft.index) return `NFT ${formatNftIndex(nft.index)}`;
    return 'NFT';
};

interface NftTileProps {
    nft: NFT;
    formatNftIndex: (index: string) => string;
}

/**
 * NFT card (image + name + index). Width follows the container — wrapped for the
 * horizontal-scroll preview on the dashboard, gridded on the full NFTs page.
 */
export const NftTile: React.FC<NftTileProps> = ({ nft, formatNftIndex }) => {
    const name = getNftName(nft, formatNftIndex);
    const indexLabel = nft.index ? formatNftIndex(nft.index) : null;

    return (
        <article className="bg-gray-100 rounded-2xl overflow-hidden">
            <div className="aspect-square w-full overflow-hidden bg-gray-300">
                <FallbackImage src={getNftImageSources(nft)} alt={name} className="w-full h-full object-cover" />
            </div>
            <div className="p-2">
                <div className="text-sm font-semibold text-gray-900 truncate">{name}</div>
                {indexLabel && (
                    <div className="text-xs text-gray-500">
                        {indexLabel.length > 10 ? `${indexLabel.slice(0, 6)}…` : indexLabel}
                    </div>
                )}
            </div>
        </article>
    );
};

/** Loading placeholder mirroring {@link NftTile}: square image area + name/index lines. */
export const NftTileSkeleton: React.FC = () => (
    <article className="bg-gray-100 rounded-2xl overflow-hidden">
        <Skeleton className="aspect-square w-full rounded-none" />
        <div className="p-2 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-10" />
        </div>
    </article>
);
