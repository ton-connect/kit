/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import { NftsList } from '@/features/nft_purchase';
import { Layout } from '@/core/components';

export const NftPurchaseCollectionPage: FC = () => {
    const { collectionAddress } = useParams<{ collectionAddress: string }>();

    if (!collectionAddress) {
        return <Navigate to="/buy-nft" replace />;
    }

    return (
        <Layout title="Buy NFT">
            <div className="space-y-4">
                <Link
                    to="/buy-nft"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to collections
                </Link>

                <NftsList collectionAddress={collectionAddress} />
            </div>
        </Layout>
    );
};
