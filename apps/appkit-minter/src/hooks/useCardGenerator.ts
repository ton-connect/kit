/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback } from 'react';

import { useMinterStore } from '@/store';

export function useCardGenerator() {
    const { currentCard, isGenerating, generateCard, clearCard } = useMinterStore();

    const generate = useCallback(() => {
        generateCard();
    }, [generateCard]);

    const clear = useCallback(() => {
        clearCard();
    }, [clearCard]);

    return {
        currentCard,
        isGenerating,
        generate,
        clear,
    };
}
