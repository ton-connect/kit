/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { v7 } from 'uuid';
import * as SecureStore from 'expo-secure-store';

export const getCurrentUserId = (): string => {
    const id = SecureStore.getItem('user_id');

    if (!id) {
        const uuid = v7();
        SecureStore.setItem('user_id', uuid);
        return uuid;
    }

    return id;
};
