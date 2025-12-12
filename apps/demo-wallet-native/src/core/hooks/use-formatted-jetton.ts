/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { Jetton } from '@ton/walletkit';

import { getFormattedJettonInfo } from '@/core/utils/jetton';

export const useFormattedJetton = (jetton?: Jetton | null) => {
    return useMemo(() => {
        if (!jetton) return;

        return getFormattedJettonInfo(jetton);
    }, [jetton]);
};
