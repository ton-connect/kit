/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';

import { FallbackImage } from '@/core/components/ui/fallback-image';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useCountUp } from '@/core/hooks/use-count-up';
import { formatLargeValue } from '@/core/utils';

/** View-model for a single balance row (TON or a jetton). */
export interface AssetRowData {
    id: string;
    /** One or more candidate icon URLs, tried in order until one loads. */
    icon?: string | string[];
    fallbackText: string;
    name: string;
    symbol: string;
    amount: number;
    rateLabel?: string;
    /** Fiat value to display on the right; omit to hide (asset has no rate). */
    fiat?: number;
}

export const AssetRow: React.FC<AssetRowData> = ({ icon, fallbackText, name, symbol, amount, rateLabel, fiat }) => {
    const animatedAmount = useCountUp(amount);
    const animatedFiat = useCountUp(fiat ?? 0);
    const hasFiat = fiat !== undefined;

    return (
        <div className="flex items-center gap-3 py-2">
            <span className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                <FallbackImage
                    src={icon}
                    alt=""
                    className="w-full h-full object-cover"
                    fallback={
                        <span className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
                            {fallbackText}
                        </span>
                    }
                />
            </span>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{name}</div>
                <div className="text-xs text-gray-500 truncate tabular-nums">
                    {formatLargeValue(String(animatedAmount), 4)} {symbol}
                    {rateLabel && ` · ${rateLabel}`}
                </div>
            </div>
            {hasFiat && (
                <div className="text-right flex-shrink-0 tabular-nums">
                    <div className="text-sm font-semibold text-gray-900">
                        ${formatLargeValue(String(animatedFiat), 2, 2)}
                    </div>
                </div>
            )}
        </div>
    );
};

/** Loading placeholder mirroring {@link AssetRow}: circular icon, name/amount lines, right-side value. */
export const AssetRowSkeleton: React.FC = () => (
    <div className="flex items-center gap-3 py-2">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
        </div>
        <div className="text-right space-y-1.5">
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-3 w-12 ml-auto" />
        </div>
    </div>
);
