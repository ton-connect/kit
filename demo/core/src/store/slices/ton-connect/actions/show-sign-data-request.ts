/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SignDataRequestEvent } from '@ton/walletkit';

import { getStore } from '../../../utils/store-instance';

export const showSignDataRequest = (request: SignDataRequestEvent) => {
    const store = getStore();

    store.setState((state) => {
        state.tonConnect.pendingSignDataRequest = request;
        state.tonConnect.isSignDataModalOpen = true;

        return state;
    });
};
