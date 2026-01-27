/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';
import type { Jetton } from '@ton/walletkit';

import { Button } from '@/components/common';

interface JettonTransferModalProps {
    jetton: Jetton;
    isOpen: boolean;
    onClose: () => void;
    onTransfer: (jetton: Jetton, recipientAddress: string, amount: string, comment?: string) => Promise<void>;
    isTransferring: boolean;
}

const formatBalance = (balance: string, decimals: number = 9): string => {
    try {
        const balanceBigInt = BigInt(balance);
        const divisor = BigInt(10 ** decimals);
        const wholePart = balanceBigInt / divisor;
        const fractionalPart = balanceBigInt % divisor;

        if (fractionalPart === 0n) {
            return wholePart.toString();
        }

        const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
        const trimmedFractional = fractionalStr.replace(/0+$/, '').slice(0, 4);

        return trimmedFractional ? `${wholePart}.${trimmedFractional}` : wholePart.toString();
    } catch {
        return '0';
    }
};

const formatAddress = (address: string): string => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const getJettonImage = (jetton: Jetton): string | null => {
    if (!jetton.info?.image) return null;

    const { url, data, mediumUrl, largeUrl, smallUrl } = jetton.info.image;

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

const getJettonName = (jetton: Jetton): string => {
    return jetton.info?.name || formatAddress(jetton.address);
};

const getJettonSymbol = (jetton: Jetton): string => {
    return jetton.info?.symbol || '';
};

export const JettonTransferModal: React.FC<JettonTransferModalProps> = ({
    jetton,
    isOpen,
    onClose,
    onTransfer,
    isTransferring,
}) => {
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [comment, setComment] = useState('');
    const [transferError, setTransferError] = useState<string | null>(null);

    const handleTransfer = async () => {
        setTransferError(null);
        try {
            await onTransfer(jetton, recipientAddress, amount, comment || undefined);
            handleClose();
        } catch (err) {
            setTransferError(err instanceof Error ? err.message : 'Transfer failed');
        }
    };

    const handleClose = () => {
        setRecipientAddress('');
        setAmount('');
        setComment('');
        setTransferError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                {getJettonImage(jetton) ? (
                                    <img
                                        src={getJettonImage(jetton)!}
                                        alt={getJettonName(jetton)}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-gray-600">
                                        {getJettonSymbol(jetton).slice(0, 2)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Transfer {getJettonName(jetton)}</h3>
                                <p className="text-sm text-gray-500">
                                    Balance: {formatBalance(jetton.balance, jetton.decimalsNumber)}{' '}
                                    {getJettonSymbol(jetton)}
                                </p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
                            <input
                                type="text"
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                placeholder="Enter TON address"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                step="any"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
                            <input
                                type="text"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>

                        {transferError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{transferError}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-3 mt-6">
                        <Button
                            className="flex-1"
                            onClick={handleTransfer}
                            disabled={!recipientAddress || !amount || isTransferring}
                            isLoading={isTransferring}
                        >
                            Send
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
