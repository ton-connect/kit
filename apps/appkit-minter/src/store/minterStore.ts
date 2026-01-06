/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { create } from 'zustand';

import type { CardData } from '@/types';
import { generateId } from '@/lib/utils';
import { getRandomRarity, getRandomName, getRandomDescription, getCardImageUrl } from '@/lib/cardData';

interface MinterState {
    currentCard: CardData | null;
    mintedCards: CardData[];
    isGenerating: boolean;
    isMinting: boolean;
    mintError: string | null;

    // Actions
    generateCard: () => void;
    mintCard: () => Promise<void>;
    clearCard: () => void;
    setMinting: (isMinting: boolean) => void;
    setMintError: (error: string | null) => void;
}

export const useMinterStore = create<MinterState>((set, get) => ({
    currentCard: null,
    mintedCards: [],
    isGenerating: false,
    isMinting: false,
    mintError: null,

    generateCard: () => {
        set({ isGenerating: true, mintError: null });

        // Simulate a brief delay for effect
        setTimeout(() => {
            const rarity = getRandomRarity();
            const name = getRandomName(rarity);
            const description = getRandomDescription(rarity);
            const imageUrl = getCardImageUrl(rarity, name);

            const newCard: CardData = {
                id: generateId(),
                name,
                rarity,
                description,
                imageUrl,
                createdAt: Date.now(),
            };

            set({ currentCard: newCard, isGenerating: false });
        }, 500);
    },

    mintCard: async () => {
        const { currentCard } = get();
        if (!currentCard) return;

        set({ isMinting: true, mintError: null });

        try {
            // The actual minting will be handled by the wallet hook
            // This just updates the local state after successful mint
            set((state) => ({
                mintedCards: [...state.mintedCards, currentCard],
                currentCard: null,
                isMinting: false,
            }));
        } catch (error) {
            set({
                mintError: error instanceof Error ? error.message : 'Failed to mint card',
                isMinting: false,
            });
        }
    },

    clearCard: () => {
        set({ currentCard: null, mintError: null });
    },

    setMinting: (isMinting: boolean) => {
        set({ isMinting });
    },

    setMintError: (error: string | null) => {
        set({ mintError: error });
    },
}));
