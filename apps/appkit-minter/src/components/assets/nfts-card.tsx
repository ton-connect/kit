/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';
import type { NFT } from '@ton/walletkit';

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

const formatAddress = (address: string): string => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const getNftImage = (nft: NFT): string | null => {
    if (!nft.info?.image) return null;

    const { url, data, mediumUrl, smallUrl, largeUrl } = nft.info.image;

    if (url) return url;
    if (mediumUrl) return mediumUrl;
    if (largeUrl) return largeUrl;
    if (smallUrl) return smallUrl;

    if (data) {
        try {
            return atob(data);
        } catch {
            return null;
        }
    }

    return null;
};

const getNftName = (nft: NFT): string => {
    if (nft.info?.name) return nft.info.name;
    if (nft.index) return `NFT #${nft.index}`;
    return formatAddress(nft.address);
};

const getCollectionName = (nft: NFT): string => {
    return nft.collection?.name || 'Unknown Collection';
};

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
                                <div
                                    key={nft.address}
                                    className="bg-muted rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
                                    onClick={() => onTransfer && setSelectedNft(nft)}
                                >
                                    <div className="aspect-square bg-card flex items-center justify-center overflow-hidden">
                                        {getNftImage(nft) ? (
                                            <img
                                                src={getNftImage(nft)!}
                                                alt={getNftName(nft)}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        parent.innerHTML = `
                                                            <svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                            </svg>
                                                        `;
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <svg
                                                className="w-8 h-8 text-muted-foreground"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="p-2">
                                        <h4 className="text-xs font-medium text-foreground truncate">
                                            {getNftName(nft)}
                                        </h4>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {getCollectionName(nft)}
                                        </p>
                                        {nft.isOnSale && (
                                            <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                                On Sale
                                            </span>
                                        )}
                                    </div>
                                </div>
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
