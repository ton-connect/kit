/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { authSliceLog } from '../utils';
import { getStore } from '../../../utils/store-instance';

export const setPassword = async (password: string) => {
    try {
        // Create a simple hash for password verification
        const passwordHashBuffer = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(password + 'wallet_salt'),
        );

        const passwordHash = Array.from(new Uint8Array(passwordHashBuffer));
        const store = getStore();

        store.setState((state) => {
            state.auth.isPasswordSet = true;
            state.auth.isUnlocked = true;
            state.auth.currentPassword = password;
            state.auth.passwordHash = passwordHash;

            return state;
        });
    } catch (error) {
        authSliceLog.error('Error setting password:', error);
        throw new Error('Failed to set password');
    }
};
