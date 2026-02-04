/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';

import { RarityBadge } from './rarity-badge';
import { RarityValues, RARITY_CONFIGS } from '../types/card';
import type { CardData, Rarity } from '../types/card';

import { cn } from '@/core/lib/utils';

const borderStyles: Record<Rarity, string> = {
    [RarityValues.Common]: 'border-gray-300',
    [RarityValues.Rare]: 'border-blue-400',
    [RarityValues.Epic]: 'border-purple-500',
    [RarityValues.Legendary]: 'border-amber-400',
};

const bgStyles: Record<Rarity, string> = {
    [RarityValues.Common]: 'bg-gradient-to-br from-gray-50 to-gray-100',
    [RarityValues.Rare]: 'bg-gradient-to-br from-blue-50 to-blue-100',
    [RarityValues.Epic]: 'bg-gradient-to-br from-purple-50 to-purple-100',
    [RarityValues.Legendary]: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
};

interface CardPreviewProps {
    card: CardData;
    className?: string;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ card, className }) => {
    const config = RARITY_CONFIGS[card.rarity];
    const isLegendary = card.rarity === RarityValues.Legendary;

    return (
        <div
            className={cn(
                'relative rounded-2xl border-2 overflow-hidden transition-all duration-300',
                borderStyles[card.rarity],
                bgStyles[card.rarity],
                config.glowClass,
                'card-glow',
                isLegendary && 'card-glow-legendary',
                className,
            )}
        >
            {/* Shimmer overlay for legendary cards */}
            {isLegendary && <div className="absolute inset-0 shimmer-overlay pointer-events-none" />}

            {/* Card content */}
            <div className="relative p-4">
                {/* Card image */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-background/50 backdrop-blur-sm border border-border/20">
                    {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg
                                className="w-16 h-16 text-muted-foreground/30"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                    )}

                    {/* Rarity badge overlay */}
                    <div className="absolute top-2 right-2">
                        <RarityBadge rarity={card.rarity} />
                    </div>
                </div>

                {/* Card info */}
                <div className="h-14">
                    <h3
                        className="text-lg font-bold text-black text-center truncate"
                        style={{ textShadow: isLegendary ? '0 0 10px rgba(245, 158, 11, 0.3)' : 'none' }}
                    >
                        {card.name}
                    </h3>

                    {card.description && (
                        <p className="text-xs text-muted-foreground text-center italic line-clamp-2">
                            {card.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Decorative corner elements for epic/legendary */}
            {/* {(card.rarity === RarityValues.Epic || card.rarity === RarityValues.Legendary) && (
                <>
                    <div
                        className="absolute top-1 left-1 w-8 h-8 border-t-2 border-l-2 rounded-tl-2xl"
                        style={{ borderColor: config.color }}
                    />
                    <div
                        className="absolute top-1 right-1 w-8 h-8 border-t-2 border-r-2 rounded-tr-2xl"
                        style={{ borderColor: config.color }}
                    />
                    <div
                        className="absolute bottom-1 left-1 w-8 h-8 border-b-2 border-l-2 rounded-bl-2xl"
                        style={{ borderColor: config.color }}
                    />
                    <div
                        className="absolute bottom-1 right-1 w-8 h-8 border-b-2 border-r-2 rounded-br-2xl"
                        style={{ borderColor: config.color }}
                    />
                </>
            )} */}
        </div>
    );
};
