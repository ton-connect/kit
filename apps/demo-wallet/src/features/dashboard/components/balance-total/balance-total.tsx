/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useCallback, useMemo } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet, useJettons, useRates } from '@demo/wallet-core';

import { useCountUp } from '@/core/hooks/use-count-up';
import { findRate, shortenAddress, toDecimal } from '@/core/utils';

const usdFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** USD value split into integer and fraction parts (no `$`), for the styled total. */
const formatUsdParts = (value: number): { intPart: string; fracPart: string } => {
    const [intPart, fracPart = '00'] = usdFormat.format(value).split('.');
    return { intPart, fracPart };
};

const GRAM_DECIMALS = 9;

export const BalanceTotal: React.FC = () => {
    const { address, balance } = useWallet();
    const { userJettons } = useJettons();
    const { entries: rates, lastUpdated: ratesUpdated } = useRates();

    // Wait for both balance and real rates (not the bootstrap TON rate) before showing the total.
    const ready = balance !== undefined && ratesUpdated > 0;

    const totalUsd = useMemo(() => {
        if (!ready) return 0;

        let total = 0;
        const tonRate = rates['GRAM']?.rate;
        if (tonRate) {
            total += toDecimal(balance, GRAM_DECIMALS) * tonRate;
        }
        for (const jetton of userJettons) {
            const rate = findRate(rates, jetton.address)?.rate;
            if (!rate) continue;
            total += toDecimal(jetton.balance, jetton.decimalsNumber ?? 9) * rate;
        }
        return total;
    }, [ready, rates, balance, userJettons]);

    const handleCopy = useCallback(async () => {
        if (!address) return;
        try {
            await navigator.clipboard.writeText(address);
            toast.success('Address copied');
        } catch {
            toast.error('Failed to copy address');
        }
    }, [address]);

    const animatedTotal = useCountUp(totalUsd);
    const { intPart, fracPart } = formatUsdParts(animatedTotal);

    return (
        <section className="flex flex-col items-center pt-6 pb-6">
            {ready ? (
                <div
                    data-testid="balance-total"
                    className="font-display font-bold tabular-nums leading-none tracking-[-2%]"
                >
                    <span className="text-5xl text-gray-400 mr-0.5">$</span>
                    <span data-testid="balance-total-int" className="text-5xl text-gray-900">
                        {intPart}
                    </span>
                    <span className="text-5xl text-gray-400">.</span>
                    <span className="text-3xl text-gray-400">{fracPart}</span>
                </div>
            ) : (
                <div className="h-12 w-56 rounded-lg bg-gray-100 animate-pulse" />
            )}

            {address ? (
                <button
                    type="button"
                    onClick={handleCopy}
                    className="mt-3 flex items-center gap-1.5 rounded-full hover:opacity-70 transition-opacity"
                    aria-label="Copy address"
                >
                    <span className="w-4 h-4 rounded-full overflow-hidden inline-block flex-shrink-0">
                        <img src="/ton.svg" alt="" className="w-full h-full" />
                    </span>
                    <span className="text-xs font-medium text-gray-500">{shortenAddress(address, 4)}</span>
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                </button>
            ) : (
                <div className="mt-3 h-4 w-32 rounded-full bg-gray-100 animate-pulse" />
            )}
        </section>
    );
};
