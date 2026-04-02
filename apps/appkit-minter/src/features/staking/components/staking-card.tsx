/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { UnstakeMode, useAddress, useBalance, useStakedBalance } from '@ton/appkit-react';
import type { UnstakeModes } from '@ton/appkit-react';

import { StakeButton } from './stake-button';

import { Card } from '@/core/components';
import { cn } from '@/core/lib/utils';

const balanceAmountFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 20,
    useGrouping: true,
});

/** Locale-aware grouping via {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat Intl.NumberFormat}. */
function formatBalanceWithSeparators(value: string): string {
    const n = Number(value.trim());
    if (!Number.isFinite(n)) {
        return value;
    }
    return balanceAmountFormatter.format(n);
}

const UNSTAKE_MODE_OPTIONS: readonly { mode: UnstakeModes; label: string; hint: string }[] = [
    { mode: UnstakeMode.INSTANT, label: 'Instant', hint: 'Receive TON immediately when pool liquidity allows.' },
    {
        mode: UnstakeMode.WHEN_AVAILABLE,
        label: 'When available',
        hint: 'Instant if liquid; otherwise queued (can take up to ~18h).',
    },
    { mode: UnstakeMode.ROUND_END, label: 'Round end', hint: 'Wait for cycle end (~18h) for a better rate.' },
];

function balanceLabel(value: string | undefined, isLoading: boolean, isError: boolean): string {
    if (isLoading) {
        return '…';
    }
    if (isError) {
        return '—';
    }
    return formatBalanceWithSeparators(value ?? '0');
}

export const StakingCard: FC = () => {
    const [amountInput, setAmountInput] = useState('');
    const [unstakeMode, setUnstakeMode] = useState<UnstakeModes>(UnstakeMode.INSTANT);
    const address = useAddress();

    const {
        data: tonBalance,
        isLoading: isTonLoading,
        isError: isTonError,
    } = useBalance({
        query: { refetchInterval: 10000 },
    });

    const {
        data: stakedData,
        isLoading: isStakedLoading,
        isError: isStakedError,
    } = useStakedBalance({
        userAddress: address ?? '',
        query: {
            refetchInterval: 10000,
            enabled: Boolean(address),
        },
    });

    const { amount, quoteEnabled } = useMemo(() => {
        const trimmed = amountInput.trim();
        if (trimmed === '') {
            return { amount: '1', quoteEnabled: true };
        }
        const n = Number(trimmed);
        if (Number.isNaN(n) || n <= 0) {
            return { amount: '1', quoteEnabled: false };
        }
        return { amount: trimmed, quoteEnabled: true };
    }, [amountInput]);

    const amountInvalid = amountInput.trim() !== '' && !quoteEnabled;

    return (
        <Card title="Staking">
            <div className="flex flex-col gap-3">
                <div className="space-y-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">TON (wallet)</span>
                        <span className="font-medium text-foreground">
                            {balanceLabel(tonBalance, isTonLoading, isTonError)} TON
                        </span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">tsTON (staked)</span>
                        <span className="font-medium text-foreground">
                            {balanceLabel(stakedData?.stakedBalance, isStakedLoading, isStakedError)} tsTON
                        </span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Instant unstake liquidity</span>
                        <span className="font-medium text-foreground">
                            {balanceLabel(stakedData?.instantUnstakeAvailable, isStakedLoading, isStakedError)} TON
                        </span>
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground" htmlFor="staking-amount">
                        Amount (optional)
                    </label>
                    <input
                        id="staking-amount"
                        type="number"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        placeholder="Default: 1"
                        step="any"
                        min="0"
                        className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring"
                    />
                    {amountInvalid ? (
                        <p className="mt-1 text-xs text-destructive">
                            Enter a positive number or leave empty to use 1.
                        </p>
                    ) : null}
                </div>

                <div>Tonstakers:</div>
                <StakeButton amount={amount} direction="stake" quoteEnabled={quoteEnabled} />

                <div className="space-y-2 border-t border-border pt-3">
                    <span className="text-sm font-medium text-muted-foreground">Unstake mode</span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {UNSTAKE_MODE_OPTIONS.map(({ mode, label }) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setUnstakeMode(mode)}
                                className={cn(
                                    'rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
                                    unstakeMode === mode
                                        ? 'border-primary bg-primary/10 text-foreground'
                                        : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {UNSTAKE_MODE_OPTIONS.find((o) => o.mode === unstakeMode)?.hint}
                    </p>
                    <StakeButton
                        amount={amount}
                        direction="unstake"
                        quoteEnabled={quoteEnabled}
                        unstakeMode={unstakeMode}
                        className="w-full"
                    />
                </div>
            </div>
        </Card>
    );
};
