/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '@ton/walletkit';

import { getStore } from '../../../utils/store-instance';
import { walletManagementLog } from '../utils';

export const loadEvents = async (limit = 10, offset = 0) => {
    const store = getStore();
    let state = store.getState();

    if (!state.walletManagement.address) {
        walletManagementLog.warn('No wallet address available to load events');
        return;
    }

    if (!state.walletCore.walletKit) {
        throw new Error('WalletKit not initialized');
    }

    try {
        walletManagementLog.info(
            'Loading events for address:',
            state.walletManagement.address,
            'limit:',
            limit,
            'offset:',
            offset,
        );

        const activeWallet = state.walletManagement.savedWallets.find(
            (w) => w.id === state.walletManagement.activeWalletId,
        );
        const walletNetwork = activeWallet?.network || 'testnet';

        const response = await state.walletCore.walletKit
            .getApiClient(walletNetwork === 'mainnet' ? Network.mainnet() : Network.testnet())
            .getEvents({
                account: state.walletManagement.address,
                limit,
                offset,
            });

        store.setState((state) => {
            state.walletManagement.events = response.events;
            state.walletManagement.hasNextEvents = response.hasNext;

            return state;
        });

        walletManagementLog.info(`Loaded ${response.events.length} events`);
    } catch (error) {
        walletManagementLog.error('Error loading events:', error);
        throw new Error('Failed to load events');
    }
};
