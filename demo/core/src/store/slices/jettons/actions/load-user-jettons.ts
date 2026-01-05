/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { JettonError } from '@ton/walletkit';

import { jettonsSliceLog } from '../utils';
import { getStore } from '../../../utils/store-instance';

export const loadUserJettons = async (userAddress?: string) => {
    const store = getStore();
    const state = store.getState();

    const address = userAddress || state.walletManagement.address;

    if (!address) {
        jettonsSliceLog.warn('No user address available to load jettons');
        return;
    }

    if (!state.walletCore.walletKit) {
        jettonsSliceLog.warn('WalletKit not initialized');
        return;
    }

    store.setState((state) => {
        state.jettons.isLoadingJettons = true;
        state.jettons.error = null;

        return state;
    });

    try {
        jettonsSliceLog.info('Loading user jettons', { address });

        const jettonsResponse = await state.walletManagement.currentWallet?.getJettons({
            pagination: {
                limit: 10,
                offset: 0,
            },
        });

        if (!jettonsResponse) {
            throw new Error('Failed to load user jettons');
        }

        store.setState((state) => {
            state.jettons.userJettons = jettonsResponse.jettons;
            state.jettons.lastJettonsUpdate = Date.now();
            state.jettons.isLoadingJettons = false;
            state.jettons.error = null;

            return state;
        });

        jettonsSliceLog.info('Successfully loaded user jettons', { count: jettonsResponse.jettons.length });
    } catch (error) {
        jettonsSliceLog.error('Failed to load user jettons:', error);

        const errorMessage =
            error instanceof JettonError
                ? `Jettons error: ${error.message} (${error.code})`
                : error instanceof Error
                  ? error.message
                  : 'Failed to load jettons';

        store.setState((state) => {
            state.jettons.isLoadingJettons = false;
            state.jettons.error = errorMessage;

            return state;
        });
    }
};
