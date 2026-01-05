/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequestEvent } from '@ton/walletkit';

import { getStore } from '../../../utils/store-instance';

export const showTransactionRequest = (request: TransactionRequestEvent) => {
    const store = getStore();

    store.setState((state) => {
        state.tonConnect.pendingTransactionRequest = request;
        state.tonConnect.isTransactionModalOpen = true;

        return state;
    });
};
