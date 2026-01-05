/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ConnectionRequestEvent } from '@ton/walletkit';

import { getStore } from '../../../utils/store-instance';

export const showConnectRequest = (request: ConnectionRequestEvent) => {
    const store = getStore();

    store.setState((state) => {
        state.tonConnect.pendingConnectRequest = request;
        state.tonConnect.isConnectModalOpen = true;

        return state;
    });
};
