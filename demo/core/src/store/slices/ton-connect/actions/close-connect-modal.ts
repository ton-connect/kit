/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';

export const closeConnectModal = () => {
    const store = getStore();

    store.setState((state) => {
        state.tonConnect.isConnectModalOpen = false;
        state.tonConnect.pendingConnectRequest = undefined;

        return state;
    });
};
