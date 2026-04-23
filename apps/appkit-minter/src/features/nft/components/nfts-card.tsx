/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import type { FC, ComponentProps } from 'react';
import type { NFT } from '@ton/appkit';
import { NftItem, useNfts } from '@ton/appkit-react';
import { AlertCircle, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Button } from '@ton/appkit-react';

import { NftTransferModal } from './nft-transfer-modal';

export const NftsCard: FC<ComponentProps<'div'>> = (props) => {
    const [selectedNft, setSelectedNft] = useState<NFT | null>(null);

    const {
        data: nftsResponse,
        isLoading: isLoading,
        isError: isError,
        refetch: onRefresh,
    } = useNfts({ query: { refetchInterval: 10000 } });

    const nfts = useMemo(() => nftsResponse?.nfts ?? [], [nftsResponse?.nfts]);

    if (isError) {
        return (
            <div title="NFTs" {...props}>
                <div className="text-center py-4">
                    <div className="text-error mb-2">
                        <AlertCircle className="w-8 h-8 mx-auto" />
                    </div>

                    <p className="text-sm text-error mb-3">Failed to load NFTs</p>

                    <Button size="s" variant="secondary" onClick={() => onRefresh()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div {...props}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-3 text-sm text-secondary-foreground">Loading NFTs...</span>
                    </div>
                ) : nfts.length === 0 ? (
                    <div className="text-center py-6">
                        <div className="text-secondary-foreground mb-2">
                            <ImageIcon className="w-10 h-10 mx-auto" />
                        </div>
                        <p className="text-sm text-secondary-foreground">No NFTs yet</p>
                        <p className="text-xs text-secondary-foreground/70 mt-1">
                            Your NFT collection will appear here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Summary */}
                        <div className="flex items-center justify-between px-2 py-4 border-b">
                            <p className="text-lg font-semibold text-foreground">NFTs</p>
                            <Button size="icon" variant="bezeled" onClick={() => onRefresh()}>
                                <RefreshCw size={16} />
                            </Button>
                        </div>

                        {/* NFT Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {nfts.slice(0, 8).map((nft) => (
                                <NftItem key={nft.address} nft={nft} onClick={() => setSelectedNft(nft)} />
                            ))}
                        </div>

                        {nfts.length > 8 && (
                            <div className="text-center pt-2">
                                <p className="text-xs text-secondary-foreground">Showing 8 of {nfts.length} NFTs</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* NFT Transfer Modal */}
            {selectedNft && (
                <NftTransferModal nft={selectedNft} isOpen={!!selectedNft} onClose={() => setSelectedNft(null)} />
            )}
        </>
    );
};
