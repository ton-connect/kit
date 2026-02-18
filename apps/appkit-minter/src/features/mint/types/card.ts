/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const RarityValues = {
    Common: 'common',
    Rare: 'rare',
    Epic: 'epic',
    Legendary: 'legendary',
} as const;

export type Rarity = (typeof RarityValues)[keyof typeof RarityValues];

export interface CardData {
    id: string;
    name: string;
    rarity: Rarity;
    imageUrl?: string;
    description?: string;
    createdAt: number;
}

export interface RarityConfig {
    rarity: Rarity;
    weight: number;
    color: string;
    bgGradient: string;
    borderColor: string;
    glowClass: string;
}

export const RARITY_CONFIGS: Record<Rarity, RarityConfig> = {
    [RarityValues.Common]: {
        rarity: RarityValues.Common,
        weight: 60,
        color: '#9ca3af',
        bgGradient: 'from-gray-100 to-gray-200',
        borderColor: 'border-gray-400',
        glowClass: 'rarity-common',
    },
    [RarityValues.Rare]: {
        rarity: RarityValues.Rare,
        weight: 25,
        color: '#3b82f6',
        bgGradient: 'from-blue-100 to-blue-200',
        borderColor: 'border-blue-500',
        glowClass: 'rarity-rare',
    },
    [RarityValues.Epic]: {
        rarity: RarityValues.Epic,
        weight: 12,
        color: '#8b5cf6',
        bgGradient: 'from-purple-100 to-purple-200',
        borderColor: 'border-purple-500',
        glowClass: 'rarity-epic',
    },
    [RarityValues.Legendary]: {
        rarity: RarityValues.Legendary,
        weight: 3,
        color: '#f59e0b',
        bgGradient: 'from-amber-100 to-yellow-200',
        borderColor: 'border-amber-500',
        glowClass: 'rarity-legendary',
    },
};
