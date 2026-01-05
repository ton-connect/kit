/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Wallet } from '@ton/walletkit';

import { getStore } from '../../../utils/store-instance';

export const getAvailableWallets = (): Wallet[] => {
    const store = getStore();
    const state = store.getState();

    if (!state.walletCore.walletKit) {
        return [];
    }

    return state.walletCore.walletKit.getWallets();
};
