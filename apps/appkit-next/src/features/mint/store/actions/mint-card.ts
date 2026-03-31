/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMinterStore } from '../minter-store';

export const mintCard = async (): Promise<void> => {
    const { currentCard } = useMinterStore.getState();
    if (!currentCard) return;

    useMinterStore.setState({ isMinting: true, mintError: null });

    try {
        // The actual minting will be handled by the wallet hook
        // This just updates the local state after successful mint
        useMinterStore.setState((state) => ({
            mintedCards: [...state.mintedCards, currentCard],
            currentCard: null,
            isMinting: false,
        }));
    } catch (error) {
        useMinterStore.setState({
            mintError: error instanceof Error ? error.message : 'Failed to mint card',
            isMinting: false,
        });
    }
};
