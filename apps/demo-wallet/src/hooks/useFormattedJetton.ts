/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo } from 'react';
import type { Jetton } from '@ton/walletkit';
import { formatJettonAmount } from '@demo/core';

import { getFormattedJettonInfo } from '@/utils/jetton';

export const useFormatJetton = () => {
    return useCallback(
        (jetton: Jetton) => {
            return getFormattedJettonInfo(formatJettonAmount)(jetton);
        },
        [formatJettonAmount],
    );
};

export const useFormattedJetton = (jetton?: Jetton | null) => {
    const formatJetton = useFormatJetton();

    return useMemo(() => {
        if (!jetton) return;

        return formatJetton(jetton);
    }, [formatJetton, jetton]);
};
