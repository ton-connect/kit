/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import { AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@ton/appkit-react';

import { useNftsOnSale } from '../hooks/use-nfts-on-sale';
import { NftCard } from './nft-card';
import { isFixPriceSale } from '../api/types';

import { Card } from '@/core/components';

interface NftsListProps {
    collectionAddress: string;
}

export const NftsList: FC<NftsListProps> = ({ collectionAddress }) => {
    const { data, isLoading, isError, refetch } = useNftsOnSale(collectionAddress);

    const nfts = useMemo(() => (data?.items ?? []).filter((nft) => isFixPriceSale(nft.sale)), [data?.items]);

    if (isError) {
        return (
            <Card title="NFTs on Sale">
                <div className="text-center py-6">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-destructive mb-3">Failed to load NFTs</p>
                    <Button size="s" variant="secondary" onClick={() => refetch()}>
                        Try Again
                    </Button>
                </div>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card title="NFTs on Sale">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-3 text-sm text-muted-foreground">Loading NFTs...</span>
                </div>
            </Card>
        );
    }

    if (nfts.length === 0) {
        return (
            <Card title="NFTs on Sale">
                <div className="text-center py-6">
                    <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No NFTs currently on sale</p>
                </div>
            </Card>
        );
    }

    return (
        <Card title={`NFTs on Sale (${nfts.length})`}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {nfts.map((nft) => (
                    <NftCard key={nft.address} nft={nft} />
                ))}
            </div>
        </Card>
    );
};
