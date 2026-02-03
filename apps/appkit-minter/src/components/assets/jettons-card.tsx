/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';
import type { Jetton } from '@ton/walletkit';
import { getFormattedJettonInfo } from '@ton/appkit';
import { CurrencyItem } from '@ton/appkit-ui-react';

import { JettonTransferModal } from './jetton-transfer-modal';

import { Card, Button } from '@/components/common';

interface JettonsCardProps {
    jettons: Jetton[];
    isLoading: boolean;
    isError: boolean;
    onRefresh: () => void;
}

export const JettonsCard: React.FC<JettonsCardProps> = ({ jettons, isLoading, isError, onRefresh }) => {
    const [selectedJetton, setSelectedJetton] = useState<Jetton | null>(null);

    if (isError) {
        return (
            <Card title="Jettons">
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
                    <p className="text-sm text-destructive mb-3">Failed to load jettons</p>
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
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-3 text-sm text-muted-foreground">Loading jettons...</span>
                    </div>
                ) : jettons.length === 0 ? (
                    <div className="text-center py-6">
                        <div className="text-muted-foreground mb-2">
                            <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                />
                            </svg>
                        </div>
                        <p className="text-sm text-muted-foreground">No jettons yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Your token balances will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Summary */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                            <p className="text-sm font-semibold text-foreground">
                                {jettons.length} {jettons.length === 1 ? 'Token' : 'Tokens'}
                            </p>
                            <Button size="sm" variant="secondary" onClick={onRefresh}>
                                Refresh
                            </Button>
                        </div>

                        {/* Jetton List */}
                        <div className="space-y-2">
                            {jettons.map((jetton) => {
                                const info = getFormattedJettonInfo(jetton);

                                if (!info || !info.symbol) {
                                    return null;
                                }

                                return (
                                    <CurrencyItem
                                        key={jetton.address}
                                        className="!bg-muted"
                                        ticker={info.symbol}
                                        name={info.name}
                                        balance={jetton.balance}
                                        decimals={jetton.decimalsNumber}
                                        icon={info.image}
                                        isVerified={jetton.isVerified}
                                        onClick={() => setSelectedJetton(jetton)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </Card>

            {/* Jetton Transfer Modal */}
            {selectedJetton && (
                <JettonTransferModal
                    jetton={selectedJetton}
                    isOpen={!!selectedJetton}
                    onClose={() => setSelectedJetton(null)}
                />
            )}
        </>
    );
};
