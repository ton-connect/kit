/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';
import type { Jetton } from '@ton/walletkit';
import { useBalance, useSelectedWallet } from '@ton/appkit-ui-react';

import { JettonTransferModal } from './JettonTransferModal';

import { Card, Button } from '@/components/common';

interface JettonsCardProps {
    jettons: Jetton[];
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
    onTransfer?: (jetton: Jetton, recipientAddress: string, amount: string, comment?: string) => Promise<void>;
    isTransferring?: boolean;
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

export const JettonsCard: React.FC<JettonsCardProps> = ({
    jettons,
    isLoading,
    error,
    onRefresh,
    onTransfer,
    isTransferring = false,
}) => {
    const [selectedJetton, setSelectedJetton] = useState<Jetton | null>(null);

    const [wallet] = useSelectedWallet();
    const isConnected = !!wallet;
    const balance = useBalance(
        { address: wallet?.getAddress() || '', network: wallet?.getNetwork() },
        { enabled: isConnected, refetchInterval: 5000 },
    );

    console.log('balance jetton', balance);

    if (error) {
        return (
            <Card title="Jettons">
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
                    <p className="text-sm text-red-600 mb-3">Failed to load jettons</p>
                    <Button size="sm" variant="secondary" onClick={onRefresh}>
                        Try Again
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card title="Jettons">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-sm text-gray-600">Loading jettons...</span>
                    </div>
                ) : jettons.length === 0 ? (
                    <div className="text-center py-6">
                        <div className="text-gray-400 mb-2">
                            <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-500">No jettons yet</p>
                        <p className="text-xs text-gray-400 mt-1">Your token balances will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Summary */}
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                            <p className="text-sm font-semibold text-gray-900">
                                {jettons.length} {jettons.length === 1 ? 'Token' : 'Tokens'}
                            </p>
                            <Button size="sm" variant="secondary" onClick={onRefresh}>
                                Refresh
                            </Button>
                        </div>

                        {/* Jetton List */}
                        <div className="space-y-2">
                            {jettons.map((jetton) => (
                                <div
                                    key={jetton.address}
                                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                    onClick={() => onTransfer && setSelectedJetton(jetton)}
                                >
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {getJettonImage(jetton) ? (
                                            <img
                                                src={getJettonImage(jetton)!}
                                                alt={getJettonName(jetton)}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <svg
                                                className="w-5 h-5 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                {getJettonName(jetton)}
                                            </h4>
                                            {jetton.isVerified && (
                                                <svg
                                                    className="w-4 h-4 text-blue-500 flex-shrink-0"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">{getJettonSymbol(jetton)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatBalance(jetton.balance, jetton.decimalsNumber)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Jetton Transfer Modal */}
            {selectedJetton && onTransfer && (
                <JettonTransferModal
                    jetton={selectedJetton}
                    isOpen={!!selectedJetton}
                    onClose={() => setSelectedJetton(null)}
                    onTransfer={onTransfer}
                    isTransferring={isTransferring}
                />
            )}
        </>
    );
};
