/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { Network } from '@ton/appkit-react';
import { useJettonsByAddress, useNetwork } from '@ton/appkit-react';

import { tryParseUiAmountToUnits } from '@/features/agents/lib/amount';

interface JettonBalancesProps {
    address: string;
    compact?: boolean;
    network?: Network;
}

export function JettonBalances({ address, compact = false, network }: JettonBalancesProps) {
    const connectedNetwork = useNetwork();
    const effectiveNetwork = network ?? connectedNetwork;
    const { data: jettonsResponse } = useJettonsByAddress({ address, network: effectiveNetwork });
    const jettons = useMemo(
        () =>
            [...(jettonsResponse?.jettons ?? [])]
                .filter((j) => (tryParseUiAmountToUnits(j.balance ?? '0', j.decimalsNumber ?? 9) ?? 0n) > 0n)
                .sort((a, b) => {
                    const usdPriceA = Number(a.prices?.find((p) => p.currency?.toUpperCase() === 'USD')?.value ?? '0');
                    const usdPriceB = Number(b.prices?.find((p) => p.currency?.toUpperCase() === 'USD')?.value ?? '0');
                    const balanceA = Number(a.balance ?? '0');
                    const balanceB = Number(b.balance ?? '0');
                    const usdEquivalentA = (Number.isFinite(usdPriceA) ? usdPriceA : 0) * (Number.isFinite(balanceA) ? balanceA : 0);
                    const usdEquivalentB = (Number.isFinite(usdPriceB) ? usdPriceB : 0) * (Number.isFinite(balanceB) ? balanceB : 0);
                    return usdEquivalentB - usdEquivalentA;
                }),
        [jettonsResponse?.jettons],
    );

    if (jettons.length === 0) return null;

    if (compact) {
        return (
            <div className="flex flex-wrap gap-1.5">
                {jettons.map((j) => (
                    <span
                        key={j.address}
                        className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-neutral-500"
                    >
                        {j.info.image?.url && <img src={j.info.image.url} alt="" className="h-3 w-3 rounded-full" />}
                        <span className="font-mono tabular-nums">{parseFloat(j.balance).toFixed(2)}</span>
                        <span className="text-neutral-600">{j.info.symbol ?? '???'}</span>
                    </span>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {jettons.map((j) => (
                <div
                    key={j.address}
                    className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-2.5"
                >
                    <div className="flex items-center gap-2.5">
                        {j.info.image?.url ? (
                            <img src={j.info.image.url} alt="" className="h-7 w-7 rounded-full" />
                        ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-medium text-neutral-500">
                                {(j.info.symbol ?? '?').slice(0, 2)}
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium">{j.info.name ?? j.info.symbol ?? 'Unknown'}</p>
                            {j.info.symbol && <p className="text-[10px] text-neutral-600">{j.info.symbol}</p>}
                        </div>
                    </div>
                    <span className="font-mono text-sm tabular-nums text-neutral-300">
                        {parseFloat(j.balance).toFixed(j.decimalsNumber && j.decimalsNumber > 4 ? 4 : 2)}
                    </span>
                </div>
            ))}
        </div>
    );
}
