/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { useJettons } from '@ton/demo-core';

import { Button } from './Button';
import { Card } from './Card';
import { JettonRow } from './JettonRow';
import { createComponentLogger } from '../utils/logger';

import { getJettonsName } from '@/utils/jetton';

const log = createComponentLogger('JettonsCard');

interface JettonsCardProps {
    className?: string;
}

export const JettonsCard: React.FC<JettonsCardProps> = ({ className = '' }) => {
    const { userJettons, isLoadingJettons, error, loadUserJettons } = useJettons();

    const handleViewAll = () => {
        // TODO: Navigate to jettons page when created
        // This would navigate to a dedicated jettons page
    };

    const formatAddress = (address: string): string => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    // Show top 3 jettons by value or balance
    const topJettons = userJettons.slice(0, 3);

    const totalJettons = userJettons.length;
    // const totalValue = userJettons.reduce((sum, jetton) => {
    //     return sum + (jetton.usdValue ? parseFloat(jetton.usdValue) : 0);
    // }, 0);
    const totalValue = 0;

    if (error) {
        return (
            <Card title="Jettons" className={className}>
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
                    <Button size="sm" variant="secondary" onClick={() => loadUserJettons()}>
                        Try Again
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card title="Jettons" className={className}>
            {isLoadingJettons ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-sm text-gray-600">Loading jettons...</span>
                </div>
            ) : totalJettons === 0 ? (
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
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                        <div className="space-y-1">
                            <p className="text-base font-semibold text-gray-900">
                                {totalJettons} {totalJettons === 1 ? 'Token' : 'Tokens'}
                            </p>
                            {totalValue > 0 && (
                                <p className="text-sm text-gray-600 font-medium">
                                    ≈ $
                                    {totalValue.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{' '}
                                    USD
                                </p>
                            )}
                        </div>
                        <Button size="sm" variant="secondary" onClick={handleViewAll}>
                            View All
                        </Button>
                    </div>

                    {/* Top Jettons */}
                    <div className="space-y-3">
                        {topJettons.map((jetton) => (
                            <JettonRow
                                key={jetton.address}
                                jetton={jetton}
                                formatAddress={formatAddress}
                                onClick={() => {
                                    // TODO: Handle jetton row click - navigate to jetton details
                                    log.info('Jetton clicked:', getJettonsName(jetton));
                                }}
                            />
                        ))}
                    </div>

                    {totalJettons > 3 && (
                        <div className="text-center pt-2">
                            <p className="text-xs text-gray-500">Showing 3 of {totalJettons} tokens</p>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};
