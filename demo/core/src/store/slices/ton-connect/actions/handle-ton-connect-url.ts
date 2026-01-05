/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';
import { tonConnectLog } from '../utils';

export const handleTonConnectUrl = async (url: string) => {
    const store = getStore();
    const state = store.getState();

    if (!state.walletCore.walletKit) {
        throw new Error('WalletKit not initialized');
    }

    try {
        tonConnectLog.info('Handling TON Connect URL:', url);
        await state.walletCore.walletKit.handleTonConnectUrl(url);
    } catch (error) {
        tonConnectLog.error('Failed to handle TON Connect URL:', error);
        throw new Error('Failed to process TON Connect link');
    }
};
