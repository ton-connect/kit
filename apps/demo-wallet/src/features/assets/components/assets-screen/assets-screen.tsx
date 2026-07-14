/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJettons } from '@demo/wallet-core';

import { AssetRow, AssetRowSkeleton } from '../asset-row';
import { useAssetRows } from '../../hooks/use-asset-rows';

import { NewLayout } from '@/core/components/shared/new-layout';
import { ScreenHeader } from '@/core/components/shared/screen-header';

/**
 * Full assets page: Gram + every held jetton, plus (on mainnet) the base tokens at a zero
 * balance when not held. Same list the dashboard preview shows the first N of — see
 * {@link useAssetRows}.
 */
export const AssetsScreen: FC = () => {
    const navigate = useNavigate();
    const { userJettons, isLoadingJettons, lastJettonsUpdate, error } = useJettons();
    const { tonRow, jettonRows, assetsReady } = useAssetRows();

    // A jettons fetch that has never succeeded and failed → short error line (not an endless
    // shimmer). Once jettons have loaded once, a transient refresh error won't show the error.
    const isError = lastJettonsUpdate === 0 && userJettons.length === 0 && error !== null && !isLoadingJettons;

    return (
        <NewLayout header={<ScreenHeader title="Assets" onBack={() => navigate('/wallet')} />}>
            {assetsReady && tonRow ? (
                <div className="space-y-1">
                    <AssetRow {...tonRow} />
                    {jettonRows.map((row) => (
                        <AssetRow key={row.id} {...row} />
                    ))}
                </div>
            ) : isError ? (
                <p className="py-12 text-center text-sm text-gray-400">Unable to load assets</p>
            ) : (
                <div className="space-y-1">
                    <AssetRowSkeleton />
                    <AssetRowSkeleton />
                    <AssetRowSkeleton />
                </div>
            )}
        </NewLayout>
    );
};
