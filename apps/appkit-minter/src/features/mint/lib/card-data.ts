/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { RarityValues, RARITY_CONFIGS } from '../types/card';
import type { Rarity } from '../types/card';

// Card names organized by rarity
export const CARD_NAMES: Record<Rarity, string[]> = {
    [RarityValues.Common]: [
        'Forest Sprite',
        'Stone Golem',
        'River Nymph',
        'Wind Wisp',
        'Earth Guardian',
        'Flame Imp',
        'Shadow Cat',
        'Crystal Beetle',
        'Moss Troll',
        'Dust Elemental',
    ],
    [RarityValues.Rare]: [
        'Storm Drake',
        'Frost Mage',
        'Thunder Wolf',
        'Void Walker',
        'Ember Phoenix',
        'Ocean Serpent',
        'Mountain Giant',
        'Star Gazer',
    ],
    [RarityValues.Epic]: [
        'Ancient Dragon',
        'Celestial Knight',
        'Shadow Reaper',
        'Arcane Wizard',
        'Divine Guardian',
        'Chaos Lord',
    ],
    [RarityValues.Legendary]: ['Eternal Phoenix', 'World Serpent', 'Cosmic Titan', 'Primordial Dragon'],
};

// Card descriptions by rarity
export const CARD_DESCRIPTIONS: Record<Rarity, string[]> = {
    [RarityValues.Common]: [
        'A humble creature of the wild.',
        'Born from the elements themselves.',
        'A faithful companion on any journey.',
    ],
    [RarityValues.Rare]: [
        'A powerful being with hidden potential.',
        'Sought after by collectors across the realm.',
        'Wielding magic beyond ordinary means.',
    ],
    [RarityValues.Epic]: [
        'A legendary creature of immense power.',
        'Few have witnessed such magnificence.',
        'Ancient magic flows through its veins.',
    ],
    [RarityValues.Legendary]: [
        'A mythical being of unparalleled power.',
        'Said to exist only in legends.',
        'The rarest of all creatures in existence.',
    ],
};

/**
 * Get a random rarity based on configured weights
 */
export function getRandomRarity(): Rarity {
    const totalWeight = Object.values(RARITY_CONFIGS).reduce((sum, config) => sum + config.weight, 0);
    let random = Math.random() * totalWeight;

    for (const rarity of Object.values(RarityValues)) {
        const config = RARITY_CONFIGS[rarity];
        if (random < config.weight) {
            return rarity;
        }
        random -= config.weight;
    }

    return RarityValues.Common;
}

/**
 * Get a random name for a given rarity
 */
export function getRandomName(rarity: Rarity): string {
    const names = CARD_NAMES[rarity];
    return names[Math.floor(Math.random() * names.length)];
}

/**
 * Get a random description for a given rarity
 */
export function getRandomDescription(rarity: Rarity): string {
    const descriptions = CARD_DESCRIPTIONS[rarity];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * Generate a placeholder image URL based on rarity
 */
export function getCardImageUrl(rarity: Rarity, name: string): string {
    const config = RARITY_CONFIGS[rarity];
    const encodedName = encodeURIComponent(name);
    const bgColor = config.color.replace('#', '');
    return `https://placehold.co/300x400/${bgColor}/ffffff?text=${encodedName}`;
}
