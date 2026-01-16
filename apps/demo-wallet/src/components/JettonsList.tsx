/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';
import type { Jetton } from '@ton/walletkit';
import { useJettons } from '@demo/wallet-core';

import { createComponentLogger } from '../utils/logger';
import { Button } from './Button';

import { useFormatJetton, useFormattedJetton } from '@/hooks/useFormattedJetton';

// Create logger for jettons list
const log = createComponentLogger('JettonsList');

interface JettonsListProps {
    className?: string;
    maxItems?: number;
    showRefreshButton?: boolean;
}

export const JettonsList: React.FC<JettonsListProps> = ({
    className = '',
    maxItems = 10,
    showRefreshButton = true,
}) => {
    const { userJettons, isLoadingJettons, isRefreshing, error, refreshJettons } = useJettons();

    const [selectedJetton, setSelectedJetton] = useState<Jetton | null>(null);

    const formatJetton = useFormatJetton();
    const selectedJettonInfo = useFormattedJetton(selectedJetton);

    const handleRefresh = async () => {
        try {
            await refreshJettons();
        } catch (err) {
            log.error('Error refreshing jettons:', err);
        }
    };

    const formatAddress = (address: string): string => {
        return `${address.slice(0, 6)}...${address.slice(-6)}`;
    };

    const displayedJettons = userJettons.slice(0, maxItems);

    if (error) {
        return (
            <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error loading jettons</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                        <div className="mt-4">
                            <Button variant="secondary" onClick={handleRefresh} size="sm">
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Your Jettons</h3>
                {showRefreshButton && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRefresh}
                        isLoading={isRefreshing}
                        disabled={isLoadingJettons}
                    >
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                )}
            </div>
            {userJettons.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading jettons...</span>
                </div>
            ) : displayedJettons.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No jettons found</p>
                    <p className="text-gray-400 text-xs mt-1">
                        Your jetton tokens will appear here when you receive them
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayedJettons.map((jetton) => {
                        const jettonInfo = formatJetton(jetton);

                        return (
                            <div
                                key={jetton.address}
                                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => setSelectedJetton(jetton)}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        {jettonInfo.image ? (
                                            <img
                                                src={jettonInfo.image}
                                                alt={jettonInfo.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                                onError={(e) => {
                                                    // Fallback to initials if image fails to load
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        parent.innerHTML = '';
                                                        parent.className += ' text-xs font-bold text-gray-600';
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-gray-600">
                                                {jettonInfo.symbol?.slice(0, 2)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">
                                            {jettonInfo.name || jettonInfo.symbol}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {jettonInfo.symbol} • {formatAddress(jetton.address)}
                                        </p>
                                        {/*{jetton.verification?.verified && (*/}
                                        {/*    <div className="flex items-center mt-1">*/}
                                        {/*        <svg*/}
                                        {/*            className="w-3 h-3 text-green-500 mr-1"*/}
                                        {/*            fill="currentColor"*/}
                                        {/*            viewBox="0 0 20 20"*/}
                                        {/*        >*/}
                                        {/*            <path*/}
                                        {/*                fillRule="evenodd"*/}
                                        {/*                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"*/}
                                        {/*                clipRule="evenodd"*/}
                                        {/*            />*/}
                                        {/*        </svg>*/}
                                        {/*        <span className="text-xs text-green-600">Verified</span>*/}
                                        {/*    </div>*/}
                                        {/*)}*/}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{jettonInfo.balance}</p>
                                    <p className="text-xs text-gray-500">{jettonInfo.symbol}</p>
                                    {/*{jetton.usdValue && <p className="text-xs text-gray-400">≈ ${jetton.usdValue}</p>}*/}
                                </div>
                            </div>
                        );
                    })}

                    {userJettons.length > maxItems && (
                        <div className="text-center py-2">
                            <p className="text-sm text-gray-500">
                                Showing {maxItems} of {userJettons.length} jettons
                            </p>
                        </div>
                    )}
                </div>
            )}
            {/* Jetton Details Modal */}
            {selectedJettonInfo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                        {selectedJettonInfo.image ? (
                                            <img
                                                src={selectedJettonInfo.image}
                                                alt={selectedJettonInfo.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-sm font-bold text-gray-600">
                                                {selectedJettonInfo.symbol?.slice(0, 2)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {selectedJettonInfo.name || selectedJettonInfo.symbol}
                                        </h3>
                                        <p className="text-sm text-gray-500">{selectedJettonInfo.symbol}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedJetton(null)}
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Balance</label>
                                    <p className="text-2xl font-bold text-gray-900">{selectedJettonInfo.balance}</p>
                                    {/*{selectedJetton.usdValue && (*/}
                                    {/*    <p className="text-sm text-gray-500">≈ ${selectedJetton.usdValue} USD</p>*/}
                                    {/*)}*/}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contract Address</label>
                                    <p className="text-sm font-mono text-gray-900 break-all">
                                        {selectedJettonInfo.address}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Wallet Address</label>
                                    <p className="text-sm font-mono text-gray-900 break-all">
                                        {selectedJettonInfo.walletAddress}
                                    </p>
                                </div>

                                {selectedJettonInfo.description && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <p className="text-sm text-gray-600">{selectedJettonInfo.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Decimals</label>
                                        <p className="text-sm text-gray-900">{selectedJettonInfo.decimals}</p>
                                    </div>
                                    {/*{selectedJetton.totalSupply && (*/}
                                    {/*    <div>*/}
                                    {/*        <label className="block text-sm font-medium text-gray-700">*/}
                                    {/*            Total Supply*/}
                                    {/*        </label>*/}
                                    {/*        <p className="text-sm text-gray-900">*/}
                                    {/*            {formatJettonAmount(*/}
                                    {/*                selectedJetton.totalSupply,*/}
                                    {/*                selectedJetton.decimals,*/}
                                    {/*            )}*/}
                                    {/*        </p>*/}
                                    {/*    </div>*/}
                                    {/*)}*/}
                                </div>

                                {/*<>{selectedJetton.verification && (*/}
                                {/*    <div>*/}
                                {/*        <label className="block text-sm font-medium text-gray-700">Verification</label>*/}
                                {/*        <div className="flex items-center mt-1">*/}
                                {/*            {selectedJetton.verification.verified ? (*/}
                                {/*                <>*/}
                                {/*                    <svg*/}
                                {/*                        className="w-4 h-4 text-green-500 mr-2"*/}
                                {/*                        fill="currentColor"*/}
                                {/*                        viewBox="0 0 20 20"*/}
                                {/*                    >*/}
                                {/*                        <path*/}
                                {/*                            fillRule="evenodd"*/}
                                {/*                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"*/}
                                {/*                            clipRule="evenodd"*/}
                                {/*                        />*/}
                                {/*                    </svg>*/}
                                {/*                    <span className="text-sm text-green-600">*/}
                                {/*                        Verified ({selectedJetton.verification.source})*/}
                                {/*                    </span>*/}
                                {/*                </>*/}
                                {/*            ) : (*/}
                                {/*                <>*/}
                                {/*                    <svg*/}
                                {/*                        className="w-4 h-4 text-yellow-500 mr-2"*/}
                                {/*                        fill="currentColor"*/}
                                {/*                        viewBox="0 0 20 20"*/}
                                {/*                    >*/}
                                {/*                        <path*/}
                                {/*                            fillRule="evenodd"*/}
                                {/*                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"*/}
                                {/*                            clipRule="evenodd"*/}
                                {/*                        />*/}
                                {/*                    </svg>*/}
                                {/*                    <span className="text-sm text-yellow-600">Not verified</span>*/}
                                {/*                </>*/}
                                {/*            )}*/}
                                {/*        </div>*/}
                                {/*        {selectedJetton.verification.warnings &&*/}
                                {/*            selectedJetton.verification.warnings.length > 0 && (*/}
                                {/*                <div className="mt-2">*/}
                                {/*                    <ul className="text-xs text-red-600 space-y-1">*/}
                                {/*                        {selectedJetton.verification.warnings.map((warning, index) => (*/}
                                {/*                            <li key={index}>• {warning}</li>*/}
                                {/*                        ))}*/}
                                {/*                    </ul>*/}
                                {/*                </div>*/}
                                {/*            )}*/}
                                {/*    </div>*/}
                                {/*)}</>*/}
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <Button
                                    className="flex-1"
                                    onClick={() => {
                                        // TODO: Implement send jetton functionality
                                        // This would navigate to send page with selected jetton
                                        setSelectedJetton(null);
                                    }}
                                >
                                    Send
                                </Button>
                                <Button variant="secondary" onClick={() => setSelectedJetton(null)} className="flex-1">
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
