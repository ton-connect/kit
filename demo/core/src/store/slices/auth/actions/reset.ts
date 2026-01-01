/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';

export const resetAuthState = () => {
    const store = getStore();

    store.setState((state) => {
        state.auth.isPasswordSet = false;
        state.auth.isUnlocked = false;
        state.auth.currentPassword = undefined;
        state.auth.passwordHash = undefined;
        state.auth.persistPassword = false;
        state.auth.useWalletInterfaceType = 'mnemonic';
        state.auth.ledgerAccountNumber = 0;

        return state;
    });
};
