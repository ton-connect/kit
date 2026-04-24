/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC } from 'react';
import { AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@ton/appkit-react';

import { useNftsOnSale } from '../hooks/use-nfts-on-sale';
import { NftCard } from './nft-card';

interface NftsListProps {
    collectionAddress: string;
}

const CURRENCY_FILTERS = ['ALL', 'TON', 'USDT'] as const;
type CurrencyFilter = (typeof CURRENCY_FILTERS)[number];

export const NftsList: FC<NftsListProps> = ({ collectionAddress }) => {
    const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>('ALL');

    const {
        items,
        totalLoaded,
        loadedPages,
        isLoading,
        isError,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        refetch,
    } = useNftsOnSale(collectionAddress, {
        currency: currencyFilter === 'ALL' ? undefined : currencyFilter,
    });

    const statsLabel =
        totalLoaded > 0
            ? `Showing ${items.length} of ${totalLoaded} loaded (${loadedPages} page${loadedPages === 1 ? '' : 's'})`
            : null;

    const controls = (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex flex-wrap gap-2">
                {CURRENCY_FILTERS.map((option) => (
                    <Button
                        key={option}
                        size="s"
                        variant={option === currencyFilter ? 'fill' : 'secondary'}
                        onClick={() => setCurrencyFilter(option)}
                    >
                        {option}
                    </Button>
                ))}
            </div>
            {statsLabel && <p className="text-xs text-muted-foreground">{statsLabel}</p>}
        </div>
    );

    if (isError) {
        return (
            <div title="NFTs on Sale">
                {controls}
                <div className="text-center py-6">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-destructive mb-3">Failed to load NFTs</p>
                    <Button size="s" variant="secondary" onClick={() => refetch()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div title="NFTs on Sale">
                {controls}
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-3 text-sm text-muted-foreground">Loading NFTs...</span>
                </div>
            </div>
        );
    }

    return (
        <div title={`NFTs on Sale (${items.length})`}>
            {controls}
            {items.length === 0 ? (
                <div className="text-center py-6">
                    {isFetchingNextPage ? (
                        <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-sm text-muted-foreground">
                                Searching for {currencyFilter === 'ALL' ? 'NFTs' : `${currencyFilter} sales`}...
                            </p>
                        </>
                    ) : (
                        <>
                            <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                                {currencyFilter === 'ALL'
                                    ? 'No NFTs currently on sale'
                                    : `No ${currencyFilter} sales found across ${totalLoaded} loaded items`}
                            </p>
                            {hasNextPage && (
                                <Button size="s" variant="secondary" className="mt-3" onClick={fetchNextPage}>
                                    Load more
                                </Button>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {items.map((nft) => (
                            <NftCard key={nft.address} nft={nft} />
                        ))}
                    </div>
                    {hasNextPage && (
                        <div className="flex justify-center mt-4">
                            <Button size="s" variant="secondary" onClick={fetchNextPage} loading={isFetchingNextPage}>
                                Load more
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
