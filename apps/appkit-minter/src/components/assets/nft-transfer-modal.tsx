/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';
import type { NFT } from '@ton/walletkit';

import { Button } from '@/components/common';

interface NftTransferModalProps {
    nft: NFT;
    isOpen: boolean;
    onClose: () => void;
    onTransfer: (nft: NFT, recipientAddress: string, comment?: string) => Promise<void>;
    isTransferring: boolean;
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

const getNftDescription = (nft: NFT): string | null => {
    return nft.info?.description || null;
};

export const NftTransferModal: React.FC<NftTransferModalProps> = ({
    nft,
    isOpen,
    onClose,
    onTransfer,
    isTransferring,
}) => {
    const [recipientAddress, setRecipientAddress] = useState('');
    const [comment, setComment] = useState('');
    const [transferError, setTransferError] = useState<string | null>(null);

    const handleTransfer = async () => {
        setTransferError(null);
        try {
            await onTransfer(nft, recipientAddress, comment || undefined);
            handleClose();
        } catch (err) {
            setTransferError(err instanceof Error ? err.message : 'Transfer failed');
        }
    };

    const handleClose = () => {
        setRecipientAddress('');
        setComment('');
        setTransferError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-card-foreground">Transfer NFT</h3>
                        <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
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

                    {/* NFT Preview */}
                    <div className="mb-4">
                        <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden mb-3">
                            {getNftImage(nft) ? (
                                <img
                                    src={getNftImage(nft)!}
                                    alt={getNftName(nft)}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <svg
                                    className="w-16 h-16 text-muted-foreground"
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
                        <h4 className="font-medium text-card-foreground">{getNftName(nft)}</h4>
                        <p className="text-sm text-muted-foreground">{getCollectionName(nft)}</p>
                        {getNftDescription(nft) && (
                            <p className="text-xs text-muted-foreground/70 mt-1">{getNftDescription(nft)}</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Recipient Address
                            </label>
                            <input
                                type="text"
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                placeholder="Enter TON address"
                                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring text-sm text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Comment (optional)
                            </label>
                            <input
                                type="text"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment"
                                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring text-sm text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        {transferError && (
                            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                                <p className="text-sm text-destructive">{transferError}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-3 mt-6">
                        <Button
                            className="flex-1"
                            onClick={handleTransfer}
                            disabled={!recipientAddress || isTransferring}
                            isLoading={isTransferring}
                        >
                            Transfer
                        </Button>
                        <Button variant="secondary" onClick={handleClose} className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
