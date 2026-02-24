/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback } from 'react';

import { generateCard } from '../store/actions/generate-card';
import { clearCard } from '../store/actions/clear-card';
import { useMinterStore } from '../store/minter-store';

export function useCardGenerator() {
    const currentCard = useMinterStore((state) => state.currentCard);
    const isGenerating = useMinterStore((state) => state.isGenerating);

    const generate = useCallback(() => {
        generateCard();
    }, []);

    const clear = useCallback(() => {
        clearCard();
    }, []);

    return {
        currentCard,
        isGenerating,
        generate,
        clear,
    };
}
