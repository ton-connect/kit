/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNfts } from '@demo/wallet-core';

import { NftTile, NftTileSkeleton } from '../nft-tile';

const SKELETON_TILES = 3;

/**
 * Dashboard NFTs preview: a horizontal-scroll strip. Shows a shimmer while the first load
 * is in flight; hides the whole block on a load error (rather than shimmering forever); shows
 * a small "No NFTs yet" stub once we've confirmed the wallet genuinely has no NFTs.
 */
export const NftsCard: React.FC = () => {
    const navigate = useNavigate();
    const { userNfts, formatNftIndex, isLoadingNfts, lastNftsUpdate, error } = useNfts();

    // States (mutually exclusive when there are no NFTs): a successful load that returned
    // nothing (lastNftsUpdate > 0) is genuinely empty — this holds even if a later background
    // refresh then errored, so a transient failure doesn't flip empty→error. isError is only
    // the "never loaded AND the fetch failed" case; otherwise the first load is still running.
    const hasNfts = userNfts.length > 0;
    const showEmpty = !hasNfts && lastNftsUpdate > 0;
    const isError = !hasNfts && lastNftsUpdate === 0 && error !== null && !isLoadingNfts;

    // On a load error, hide the whole block rather than shimmering forever.
    if (isError) {
        return null;
    }

    return (
        <section>
            <button
                type="button"
                onClick={() => navigate('/wallet/nft')}
                className="flex items-center gap-1 mb-2"
                aria-label="View all NFTs"
            >
                <h2 className="text-base font-semibold text-gray-900">NFTs</h2>
                <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {hasNfts ? (
                <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    {userNfts.map((nft) => (
                        <div key={nft.address} className="w-36 flex-shrink-0">
                            <NftTile nft={nft} formatNftIndex={formatNftIndex} />
                        </div>
                    ))}
                </div>
            ) : showEmpty ? (
                // Genuinely-empty wallet: a small stub instead of hiding the section.
                <p className="py-4 text-sm text-gray-400">No NFTs yet</p>
            ) : (
                <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    {Array.from({ length: SKELETON_TILES }).map((_, index) => (
                        <div key={index} className="w-36 flex-shrink-0">
                            <NftTileSkeleton />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};
