/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNfts } from '@demo/wallet-core';

import { NftTile, NftTileSkeleton } from '../nft-tile';

import { NewLayout } from '@/core/components/shared/new-layout';
import { ScreenHeader } from '@/core/components/shared/screen-header';

const SKELETON_TILES = 4;

/** Full NFTs page: every NFT held by the active wallet, as a grid. */
export const NftsScreen: FC = () => {
    const navigate = useNavigate();
    const { userNfts, formatNftIndex, isLoadingNfts, lastNftsUpdate, error } = useNfts();

    const hasNfts = userNfts.length > 0;
    // "No NFTs yet" is truthful once a load has succeeded and returned nothing (even if a later
    // background refresh then errored). "Couldn't load" is only when no load ever succeeded and
    // the fetch failed — otherwise the first load is still running (shimmer).
    const showEmpty = !hasNfts && lastNftsUpdate > 0;
    const isError = !hasNfts && lastNftsUpdate === 0 && error !== null && !isLoadingNfts;

    return (
        <NewLayout header={<ScreenHeader title="NFTs" onBack={() => navigate('/wallet')} />}>
            {hasNfts ? (
                <div className="grid grid-cols-2 gap-3">
                    {userNfts.map((nft) => (
                        <NftTile key={nft.address} nft={nft} formatNftIndex={formatNftIndex} />
                    ))}
                </div>
            ) : isError ? (
                <p className="py-12 text-center text-sm text-gray-400">Unable to load NFTs</p>
            ) : showEmpty ? (
                <p className="py-12 text-center text-sm text-gray-400">No NFTs yet</p>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: SKELETON_TILES }).map((_, index) => (
                        <NftTileSkeleton key={index} />
                    ))}
                </div>
            )}
        </NewLayout>
    );
};
