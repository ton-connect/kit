/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';
import type { NFT } from '@ton/walletkit';
import { NftItem } from '@ton/appkit-ui-react';

import { NftTransferModal } from './nft-transfer-modal';

import { Card, Button } from '@/components/common';

interface NftsCardProps {
    nfts: NFT[];
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
    onTransfer?: (nft: NFT, recipientAddress: string, comment?: string) => Promise<void>;
    isTransferring?: boolean;
}

export const NftsCard: React.FC<NftsCardProps> = ({
    nfts,
    isLoading,
    error,
    onRefresh,
    onTransfer,
    isTransferring = false,
}) => {
    const [selectedNft, setSelectedNft] = useState<NFT | null>(null);

    if (error) {
        return (
            <Card title="NFTs">
                <div className="text-center py-4">
                    <div className="text-destructive mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <p className="text-sm text-destructive mb-3">Failed to load NFTs</p>
                    <Button size="sm" variant="secondary" onClick={onRefresh}>
                        Try Again
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card title="NFTs">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-3 text-sm text-muted-foreground">Loading NFTs...</span>
                    </div>
                ) : nfts.length === 0 ? (
                    <div className="text-center py-6">
                        <div className="text-muted-foreground mb-2">
                            <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <p className="text-sm text-muted-foreground">No NFTs yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Your NFT collection will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Summary */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                            <p className="text-sm font-semibold text-foreground">
                                {nfts.length} {nfts.length === 1 ? 'NFT' : 'NFTs'}
                            </p>
                            <Button size="sm" variant="secondary" onClick={onRefresh}>
                                Refresh
                            </Button>
                        </div>

                        {/* NFT Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {nfts.slice(0, 8).map((nft) => (
                                <NftItem
                                    key={nft.address}
                                    nft={nft}
                                    className="!bg-muted"
                                    onClick={() => onTransfer && setSelectedNft(nft)}
                                />
                            ))}
                        </div>

                        {nfts.length > 8 && (
                            <div className="text-center pt-2">
                                <p className="text-xs text-muted-foreground">Showing 8 of {nfts.length} NFTs</p>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {/* NFT Transfer Modal */}
            {selectedNft && onTransfer && (
                <NftTransferModal
                    nft={selectedNft}
                    isOpen={!!selectedNft}
                    onClose={() => setSelectedNft(null)}
                    onTransfer={onTransfer}
                    isTransferring={isTransferring}
                />
            )}
        </>
    );
};
