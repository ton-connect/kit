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
import { useJettons } from '@demo/wallet-core';

import { AssetRow, AssetRowSkeleton, useAssetRows } from '@/features/assets';

// How many jettons the dashboard preview shows below the Gram row. The full Assets page shows
// the whole list; the preview shows the first N of that SAME list (see note below).
const JETTON_SLOTS = 2;

/**
 * Dashboard "Assets" block. Shows the Gram row plus the first {@link JETTON_SLOTS} jettons from
 * {@link useAssetRows} — the first N of the exact same list the full Assets page renders, so the
 * two surfaces are consistent. That shared list includes the held jettons plus, on mainnet, the
 * base tokens (USDT/XAUt) at a zero balance when not held, so a new mainnet wallet shows Gram +
 * those on both surfaces. On a jettons load error the block is hidden rather than shimmering
 * forever; while loading it shows shimmer rows.
 */
export const DashboardAssets: React.FC = () => {
    const navigate = useNavigate();
    const { userJettons, isLoadingJettons, lastJettonsUpdate, error } = useJettons();
    const { tonRow, jettonRows, assetsReady } = useAssetRows();

    // Preview: the first JETTON_SLOTS rows of the same list the Assets page renders.
    const preview = jettonRows.slice(0, JETTON_SLOTS);

    // A jettons fetch that has never succeeded and failed → hide the whole block (don't shimmer
    // forever). Once jettons have loaded once, a transient refresh error won't hide the block.
    const isError = lastJettonsUpdate === 0 && userJettons.length === 0 && error !== null && !isLoadingJettons;
    if (isError) {
        return null;
    }

    return (
        <section>
            <button
                type="button"
                onClick={() => navigate('/wallet/assets')}
                className="flex items-center gap-1 mb-2"
                aria-label="View all assets"
            >
                <h2 className="text-base font-semibold text-gray-900">Assets</h2>
                <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <div className="space-y-1">
                {tonRow ? <AssetRow {...tonRow} /> : <AssetRowSkeleton />}
                {assetsReady ? (
                    preview.map((row) => <AssetRow key={row.id} {...row} />)
                ) : (
                    <>
                        <AssetRowSkeleton />
                        <AssetRowSkeleton />
                    </>
                )}
            </div>
        </section>
    );
};
