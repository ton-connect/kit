/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';

export const setPersistPassword = async (persist: boolean) => {
    const store = getStore();

    store.setState((state) => {
        state.auth.persistPassword = persist;

        // If disabling persistence, clear the persisted password
        if (!persist) {
            state.auth.currentPassword = undefined;
        }

        return state;
    });
};
