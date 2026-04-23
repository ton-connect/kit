/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import type { ComponentProps, FC } from 'react';
import type { Jetton } from '@ton/appkit';
import { getFormattedJettonInfo } from '@ton/appkit';
import { useBalance, useJettons } from '@ton/appkit-react';
import { Button } from '@ton/appkit-react';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { JettonCard } from './jetton-card';
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

    const jettons = useMemo(
        () => jettonsResponse?.jettons?.filter((j) => j.balance !== '0') ?? [],
        [jettonsResponse?.jettons],
    );

    const isLoading = isBalanceLoading || isJettonsLoading;
    const isError = isBalanceError || isJettonsError;

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

    if (isLoading) {
        return (
            <div className={cn('flex items-center justify-center py-8', className)} {...props}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-3 text-sm text-tertiary-foreground">Loading balances...</span>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between px-2 py-4 border-b">
                <p className="text-lg font-semibold text-foreground">Jettons</p>
                <Button size="icon" variant="bezeled" onClick={() => onRefresh()}>
                    <RefreshCw size={16} />
                </Button>
            </div>

            <div className={cn('flex flex-col', className)} {...props}>
                <JettonCard
                    ticker="TON"
                    name="Toncoin"
                    image="/ton.png"
                    balance={balance || '0'}
                    onClick={() => setSelectedToken({ type: 'TON' })}
                    address="ton"
                />

                {jettons.map((jetton, index) => {
                    const info = getFormattedJettonInfo(jetton);

                    if (!info?.symbol) return null;

                    return (
                        <JettonCard
                            key={jetton.address}
                            ticker={info.symbol}
                            name={info.name}
                            image={info.image}
                            balance={info.balance}
                            onClick={() => setSelectedToken({ type: 'JETTON', jetton })}
                            isLastItem={index === jettons.length - 1}
                            address={jetton.address}
                        />
                    );
                })}
            </div>

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
