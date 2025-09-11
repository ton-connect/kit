import React, { useEffect, useState } from 'react';
import type { NftItem } from '@ton/walletkit';

import { useNfts, useWallet } from '../stores';
import { Button } from './Button';
import { Card } from './Card';
// import { createComponentLogger } from '../utils/logger';

// const _log = createComponentLogger('NftsCard');

interface NftsCardProps {
    className?: string;
}

export const NftsCard: React.FC<NftsCardProps> = ({ className = '' }) => {
    const { address } = useWallet();
    const { lastNftsUpdate, userNfts, isLoadingNfts, error, loadUserNfts, formatNftIndex } = useNfts();
    const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);

    // Load NFTs on mount if none are loaded
    useEffect(() => {
        if (lastNftsUpdate > 0 && Date.now() - lastNftsUpdate < 10000) {
            return;
        }
        loadUserNfts();
    }, [address, loadUserNfts]);

    // Auto refresh NFTs every 30 seconds (less frequent than jettons)
    useEffect(() => {
        const interval = setInterval(() => {
            loadUserNfts();
        }, 30000);
        return () => clearInterval(interval);
    }, [loadUserNfts]);

    const handleViewAll = () => {
        // TODO: Navigate to NFTs page when created
        // This would navigate to a dedicated NFTs page
    };

    const formatAddress = (address: string): string => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    const getNftImage = (nft: NftItem): string | null => {
        // Try to extract image from content metadata
        if (nft.content && typeof nft.content === 'object') {
            const content = nft.content as Record<string, unknown>;
            if (content.image && typeof content.image === 'string') return content.image;
            if (content.image_url && typeof content.image_url === 'string') return content.image_url;
            if (content.uri && typeof content.uri === 'string') {
                // If URI is an IPFS hash, convert to gateway URL
                if (content.uri.startsWith('ipfs://')) {
                    return `https://ipfs.io/ipfs/${content.uri.slice(7)}`;
                }
                return content.uri;
            }
        }
        return null;
    };

    const getNftName = (nft: NftItem): string => {
        if (nft.content && typeof nft.content === 'object') {
            const content = nft.content as Record<string, unknown>;
            if (content.name && typeof content.name === 'string') return content.name;
            if (content.title && typeof content.title === 'string') return content.title;
        }
        if (nft.collection?.collectionContent) {
            const collectionContent = nft.collection.collectionContent as Record<string, unknown>;
            if (collectionContent.name && typeof collectionContent.name === 'string') {
                return `${collectionContent.name} ${formatNftIndex(nft.index)}`;
            }
        }
        return `NFT ${formatNftIndex(nft.index)}`;
    };

    const getNftDescription = (nft: NftItem): string | null => {
        if (nft.content && typeof nft.content === 'object') {
            const content = nft.content as Record<string, unknown>;
            if (content.description && typeof content.description === 'string') return content.description;
        }
        return null;
    };

    // Show top 3 NFTs
    const topNfts = userNfts.slice(0, 3);
    const totalNfts = userNfts.length;

    if (error) {
        return (
            <Card title="NFTs" className={className}>
                <div className="text-center py-4">
                    <div className="text-red-400 mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <p className="text-sm text-red-600 mb-3">Failed to load NFTs</p>
                    <Button size="sm" variant="secondary" onClick={() => loadUserNfts()}>
                        Try Again
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card title="NFTs" className={className}>
            {isLoadingNfts ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-sm text-gray-600">Loading NFTs...</span>
                </div>
            ) : totalNfts === 0 ? (
                <div className="text-center py-6">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-500">No NFTs yet</p>
                    <p className="text-xs text-gray-400 mt-1">Your NFT collection will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                        <div className="space-y-1">
                            <p className="text-base font-semibold text-gray-900">
                                {totalNfts} {totalNfts === 1 ? 'NFT' : 'NFTs'}
                            </p>
                            <p className="text-sm text-gray-600">Digital collectibles</p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={handleViewAll}>
                            View All
                        </Button>
                    </div>

                    {/* Top NFTs */}
                    <div className="grid grid-cols-1 gap-3">
                        {topNfts.map((nft) => (
                            <div
                                key={nft.address}
                                className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => setSelectedNft(nft)}
                            >
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                    {getNftImage(nft) ? (
                                        <img
                                            src={getNftImage(nft)!}
                                            alt={getNftName(nft)}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback to placeholder if image fails to load
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `
                                                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                        </svg>
                                                    `;
                                                }
                                            }}
                                        />
                                    ) : (
                                        <svg
                                            className="w-6 h-6 text-gray-400"
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
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">{getNftName(nft)}</h4>
                                    <p className="text-xs text-gray-500 truncate">
                                        {nft.collection?.collectionContent &&
                                        typeof (nft.collection.collectionContent as Record<string, unknown>).name ===
                                            'string'
                                            ? ((nft.collection.collectionContent as Record<string, unknown>)
                                                  .name as string)
                                            : formatAddress(nft.address)}
                                    </p>
                                    {nft.onSale && (
                                        <div className="flex items-center mt-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                On Sale
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-shrink-0">
                                    <svg
                                        className="w-4 h-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalNfts > 3 && (
                        <div className="text-center pt-2">
                            <p className="text-xs text-gray-500">Showing 3 of {totalNfts} NFTs</p>
                        </div>
                    )}
                </div>
            )}

            {/* NFT Details Modal */}
            {selectedNft && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900 truncate">
                                    {getNftName(selectedNft)}
                                </h3>
                                <button
                                    onClick={() => setSelectedNft(null)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* NFT Image */}
                                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                    {getNftImage(selectedNft) ? (
                                        <img
                                            src={getNftImage(selectedNft)!}
                                            alt={getNftName(selectedNft)}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <svg
                                            className="w-16 h-16 text-gray-400"
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

                                {/* Description */}
                                {getNftDescription(selectedNft) && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <p className="text-sm text-gray-600 mt-1">{getNftDescription(selectedNft)}</p>
                                    </div>
                                )}

                                {/* Collection */}
                                {selectedNft.collection && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Collection</label>
                                        <p className="text-sm text-gray-900">
                                            {selectedNft.collection.collectionContent &&
                                            typeof (selectedNft.collection.collectionContent as Record<string, unknown>)
                                                .name === 'string'
                                                ? ((selectedNft.collection.collectionContent as Record<string, unknown>)
                                                      .name as string)
                                                : 'Unknown Collection'}
                                        </p>
                                        {selectedNft.collection.collectionContent &&
                                            typeof (selectedNft.collection.collectionContent as Record<string, unknown>)
                                                .description === 'string' && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {
                                                        (
                                                            selectedNft.collection.collectionContent as Record<
                                                                string,
                                                                unknown
                                                            >
                                                        ).description as string
                                                    }
                                                </p>
                                            )}
                                    </div>
                                )}

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Index</label>
                                        <p className="text-sm text-gray-900">{formatNftIndex(selectedNft.index)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <p className="text-sm text-gray-900">
                                            {selectedNft.onSale ? 'On Sale' : 'Not for Sale'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contract Address</label>
                                    <p className="text-sm font-mono text-gray-900 break-all">{selectedNft.address}</p>
                                </div>

                                {selectedNft.ownerAddress && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Owner</label>
                                        <p className="text-sm font-mono text-gray-900 break-all">
                                            {selectedNft.ownerAddress}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <Button
                                    className="flex-1"
                                    onClick={() => {
                                        // TODO: Implement send NFT functionality
                                        // This would navigate to send page with selected NFT
                                        setSelectedNft(null);
                                    }}
                                >
                                    Transfer
                                </Button>
                                <Button variant="secondary" onClick={() => setSelectedNft(null)} className="flex-1">
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};
