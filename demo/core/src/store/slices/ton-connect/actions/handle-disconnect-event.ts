/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DisconnectionEvent } from '@ton/walletkit';

import { getStore } from '../../../utils/store-instance';
import { tonConnectLog } from '../utils';

export const handleDisconnectEvent = (event: DisconnectionEvent) => {
    const store = getStore();

    tonConnectLog.info('Disconnect event received:', event);

    store.setState((state) => {
        state.tonConnect.isTransactionModalOpen = false;
        state.tonConnect.pendingTransactionRequest = undefined;

        return state;
    });
};
