/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { authSliceLog } from '../utils';
import { getStore } from '../../../utils/store-instance';

export const unlock = async (password: string) => {
    try {
        const store = getStore();
        const state = store.getState();

        if (!state.auth.passwordHash) return false;

        // Verify password
        const passwordHashBuffer = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(password + 'wallet_salt'),
        );

        const currentHash = Array.from(new Uint8Array(passwordHashBuffer));
        const isValid = state.auth.passwordHash.every((byte: number, index: number) => byte === currentHash[index]);

        if (isValid) {
            store.setState((state) => {
                state.auth.isUnlocked = true;
                state.auth.currentPassword = password;

                return state;
            });

            return true;
        }

        return false;
    } catch (error) {
        authSliceLog.error('Error unlocking wallet:', error);
        return false;
    }
};
