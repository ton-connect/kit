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
import { CurrencyItem, useJettons, useBalance } from '@ton/appkit-react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@ton/appkit-react';

import { TokenTransferModal } from './token-transfer-modal';

import { cn } from '@/core/lib/utils';

interface SelectedToken {
    type: 'TON' | 'JETTON';
    jetton?: Jetton;
}

export const TokensCard: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
    const [selectedToken, setSelectedToken] = useState<SelectedToken | null>(null);

    const {
        data: balance,
        isLoading: isBalanceLoading,
        isError: isBalanceError,
    } = useBalance({ query: { refetchInterval: 20000 } });

    const {
        data: jettonsResponse,
        isLoading: isJettonsLoading,
        isError: isJettonsError,
        refetch: onRefresh,
    } = useJettons({ query: { refetchInterval: 20000 } });

    const jettons = useMemo(() => jettonsResponse?.jettons ?? [], [jettonsResponse?.jettons]);

    const isLoading = isBalanceLoading || isJettonsLoading;
    const isError = isBalanceError || isJettonsError;

    const totalTokens = jettons.length + 1; // +1 for TON

    if (isError) {
        return (
            <div className={cn('flex flex-col items-center text-center py-4', className)} {...props}>
                <div className="text-error mb-2">
                    <AlertCircle className="w-8 h-8 mx-auto" />
                </div>

                <p className="text-sm text-error mb-3">Failed to load balances</p>

                <Button size="s" variant="secondary" onClick={() => onRefresh()}>
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className={cn('', className)} {...props}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-3 text-sm text-tertiary-foreground">Loading balances...</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Summary */}
                        <div className="flex items-center p-3 bg-secondary rounded-lg border border-secondary">
                            <p className="text-sm font-semibold text-foreground mr-auto">
                                {totalTokens} {totalTokens === 1 ? 'Asset' : 'Assets'}
                            </p>
                            <Button size="m" className="mr-2" variant="bezeled" onClick={() => onRefresh()}>
                                Refresh
                            </Button>
                        </div>

                        {/* Token List */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-secondary">
                                <CurrencyItem
                                    ticker="TON"
                                    name="Toncoin"
                                    balance={balance || '0'}
                                    onClick={() => setSelectedToken({ type: 'TON' })}
                                    icon="./ton.png"
                                    isVerified
                                />
                            </div>

                            {/* Jettons */}
                            {jettons.map((jetton) => {
                                const info = getFormattedJettonInfo(jetton);

                                if (!info || !info.symbol) {
                                    return null;
                                }

                                return (
                                    <div
                                        key={jetton.address}
                                        className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-secondary"
                                    >
                                        <CurrencyItem
                                            ticker={info.symbol}
                                            name={info.name}
                                            balance={jetton.balance}
                                            icon={info.image}
                                            isVerified={jetton.isVerified}
                                            onClick={() => setSelectedToken({ type: 'JETTON', jetton })}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

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
