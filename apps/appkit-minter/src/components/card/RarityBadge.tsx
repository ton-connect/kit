/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';

import { cn } from '@/lib/utils';
import { RarityValues, RARITY_CONFIGS } from '@/types';
import type { Rarity } from '@/types';

interface RarityBadgeProps {
    rarity: Rarity;
    className?: string;
}

export const RarityBadge: React.FC<RarityBadgeProps> = ({ rarity, className }) => {
    const config = RARITY_CONFIGS[rarity];

    const badgeStyles: Record<Rarity, string> = {
        [RarityValues.Common]: 'bg-gray-100 text-gray-700 border-gray-300',
        [RarityValues.Rare]: 'bg-blue-100 text-blue-700 border-blue-300',
        [RarityValues.Epic]: 'bg-purple-100 text-purple-700 border-purple-300',
        [RarityValues.Legendary]: 'bg-amber-100 text-amber-700 border-amber-300',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize',
                badgeStyles[rarity],
                className,
            )}
            style={{ borderColor: config.color }}
        >
            {rarity === RarityValues.Legendary && <span className="mr-1">✨</span>}
            {rarity}
        </span>
    );
};
