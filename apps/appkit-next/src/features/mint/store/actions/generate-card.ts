/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getRandomRarity, getRandomName, getRandomDescription, getCardImageUrl } from '../../lib/card-data';
import type { CardData } from '../../types/card';
import { useMinterStore } from '../minter-store';

import { generateId } from '@/core/lib/utils';

export const generateCard = async (): Promise<void> => {
    useMinterStore.setState({ isGenerating: true, mintError: null });

    const rarity = getRandomRarity();
    const name = getRandomName(rarity);
    const description = getRandomDescription(rarity);
    const imageUrl = await getCardImageUrl(rarity, name);

    const newCard: CardData = {
        id: generateId(),
        name,
        rarity,
        description,
        imageUrl,
        createdAt: Date.now(),
    };

    useMinterStore.setState({ currentCard: newCard, isGenerating: false });
};
