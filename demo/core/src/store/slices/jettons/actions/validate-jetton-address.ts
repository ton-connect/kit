/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';
import { jettonsSliceLog } from '../utils';

export const validateJettonAddress = (address: string) => {
    const store = getStore();
    const state = store.getState();

    if (!state.walletCore.walletKit) {
        jettonsSliceLog.warn('WalletKit not initialized');

        return false;
    }

    return state.walletCore.walletKit.jettons.validateJettonAddress(address);
};
