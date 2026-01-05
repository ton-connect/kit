/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';

export const closeSignDataModal = () => {
    const store = getStore();

    store.setState((state) => {
        state.tonConnect.isSignDataModalOpen = false;
        state.tonConnect.pendingSignDataRequest = undefined;

        return state;
    });
};
