/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';

export const getJettonByAddress = (jettonAddress: string) => {
    const store = getStore();
    const state = store.getState();

    return state.jettons.userJettons.find((j) => j.address === jettonAddress);
};
