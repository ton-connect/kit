/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useJettons, useWallet, formatUnits, formatTon } from '@demo/wallet-core';

import { TokenSelector } from './TokenSelector';
import { Button } from '../Button';

import { cn } from '@/lib/utils';

interface Props {
    label: string;
    token: string;
    amount: string;
    onTokenSelect: (token: string) => void;
    onAmountChange: (amount: string) => void;
    excludeToken?: string;
    isOutput?: boolean;
    className?: string;
}

export const TokenInput: FC<Props> = ({
    label,
    token,
    amount,
    onTokenSelect,
    onAmountChange,
    excludeToken,
    isOutput = false,
    className,
}) => {
    const { balance } = useWallet();
    const { userJettons } = useJettons();

    const getTokenBalance = (tokenAddress: string): string => {
        if (tokenAddress === 'TON') {
            return formatTon(balance || '0');
        }

        const jetton = userJettons.find((j) => j.address === tokenAddress);
        if (jetton && jetton.balance && jetton.decimalsNumber) {
            const decimals = jetton.decimalsNumber;
            return formatUnits(jetton.balance, decimals);
        }

        return '0';
    };

    const handleMaxClick = () => {
        if (isOutput) return;

        if (token === 'TON') {
            const currentBalance = parseFloat(formatTon(balance || '0'));
            const maxAmount = currentBalance - 0.1;
            if (maxAmount > 0) {
                onAmountChange(maxAmount.toString());
            }
        } else {
            const jetton = userJettons.find((j) => j.address === token);
            if (jetton && jetton.balance) {
                const decimals = jetton.decimalsNumber || 9;
                const balanceInUnits = formatUnits(jetton.balance, decimals);
                onAmountChange(balanceInUnits);
            }
        }
    };

    const tokenBalance = getTokenBalance(token);

    return (
        <div className={cn('space-y-3 overflow-hidden rounded-lg bg-secondary px-4 py-5.5', className)}>
            <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground text-sm">{label}</span>

                {token && (
                    <div className="flex items-center text-muted-foreground text-xs">
                        <p>Balance: </p>
                        <span className="ml-1 text-muted-foreground text-xs">
                            {parseFloat(tokenBalance).toFixed(6)}
                        </span>
                        {!isOutput && parseFloat(tokenBalance) > 0 && (
                            <Button className="h-5 px-2! ml-2 text-xs" onClick={handleMaxClick} size="sm">
                                Max
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex max-w-full items-center gap-2 overflow-hidden">
                <div className="flex-1">
                    <input
                        className="w-full font-semibold text-3xl outline-none [-moz-appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        disabled={isOutput}
                        id={`amount-${label}`}
                        onChange={(e) => onAmountChange(e.target.value)}
                        placeholder="0"
                        type="text"
                        value={amount}
                    />
                </div>

                <TokenSelector excludeToken={excludeToken} onTokenSelect={onTokenSelect} selectedToken={token} />
            </div>
        </div>
    );
};
