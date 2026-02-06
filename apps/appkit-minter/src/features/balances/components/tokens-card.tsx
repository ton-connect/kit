/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import type { FC, ComponentProps } from 'react';
import type { Jetton } from '@ton/appkit';
import { getFormattedJettonInfo } from '@ton/appkit';
import { CurrencyItem, useSelectedWalletJettons, useSelectedWalletBalance } from '@ton/appkit-ui-react';

import { TokenTransferModal } from './token-transfer-modal';

import { Card, Button } from '@/core/components';

interface SelectedToken {
    type: 'TON' | 'JETTON';
    jetton?: Jetton;
}

export const TokensCard: FC<ComponentProps<'div'>> = (props) => {
    const [selectedToken, setSelectedToken] = useState<SelectedToken | null>(null);

    const {
        data: balance,
        isLoading: isBalanceLoading,
        isError: isBalanceError,
    } = useSelectedWalletBalance({ refetchInterval: 10000 });

    const {
        data: jettonsResponse,
        isLoading: isJettonsLoading,
        isError: isJettonsError,
        refetch: onRefresh,
    } = useSelectedWalletJettons({ refetchInterval: 10000 });

    const jettons = useMemo(() => jettonsResponse?.jettons ?? [], [jettonsResponse?.jettons]);

    const isLoading = isBalanceLoading || isJettonsLoading;
    const isError = isBalanceError || isJettonsError;

    const totalTokens = jettons.length + 1; // +1 for TON

    if (isError) {
        return (
            <Card title="Balances" {...props}>
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

                    <p className="text-sm text-destructive mb-3">Failed to load balances</p>

                    <Button size="sm" variant="secondary" onClick={() => onRefresh()}>
                        Try Again
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card title="Balances" {...props}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-3 text-sm text-muted-foreground">Loading balances...</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Summary */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                            <p className="text-sm font-semibold text-foreground">
                                {totalTokens} {totalTokens === 1 ? 'Asset' : 'Assets'}
                            </p>
                            <Button size="sm" variant="primary" onClick={() => onRefresh()}>
                                Refresh
                            </Button>
                        </div>

                        {/* Token List */}
                        <div className="space-y-2">
                            <CurrencyItem
                                className="!bg-muted"
                                ticker="TON"
                                name="Toncoin"
                                balance={balance || '0'}
                                decimals={9}
                                onClick={() => setSelectedToken({ type: 'TON' })}
                                icon="./ton.png"
                                isVerified
                            />

                            {/* Jettons */}
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
                                        onClick={() => setSelectedToken({ type: 'JETTON', jetton })}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </Card>

            {/* Token Transfer Modal */}
            {selectedToken && (
                <TokenTransferModal
                    tokenType={selectedToken.type}
                    jetton={selectedToken.jetton}
                    tonBalance={balance || '0'}
                    isOpen={!!selectedToken}
                    onClose={() => setSelectedToken(null)}
                />
            )}
        </>
    );
};
