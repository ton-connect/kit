/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFTsResponse } from '@ton/walletkit';

import { getStore } from '../../../utils/store-instance';
import { nftsSliceLog } from '../utils';

const DEFAULT_LIMIT = 20;

export const refreshNfts = async (userAddress?: string, limit: number = DEFAULT_LIMIT) => {
    const store = getStore();
    const state = store.getState();

    const address = userAddress || state.walletManagement.address;

    if (!address) {
        nftsSliceLog.warn('No user address available to refresh NFTs');
        return;
    }

    const walletKit = state.walletCore.walletKit;

    if (!walletKit) {
        nftsSliceLog.warn('WalletKit not initialized');
        return;
    }

    store.setState((state) => {
        state.nfts.isRefreshing = true;
        state.nfts.error = null;

        return state;
    });

    try {
        nftsSliceLog.info('Refreshing user NFTs', { address });

        const wallet = walletKit.getWallets().find((w) => w.getAddress() === address);

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const result: NFTsResponse = await wallet.getNfts({
            pagination: { limit, offset: 0 },
        });

        store.setState((state) => {
            state.nfts.userNfts = result.nfts;
            state.nfts.lastNftsUpdate = Date.now();
            state.nfts.isRefreshing = false;
            state.nfts.error = null;
            state.nfts.hasMore = result.nfts.length === limit;
            state.nfts.offset = result.nfts.length;

            return state;
        });

        nftsSliceLog.info('Successfully refreshed user NFTs', { count: result.nfts.length });
    } catch (error) {
        nftsSliceLog.error('Failed to refresh user NFTs:', error);

        const errorMessage = error instanceof Error ? error.message : 'Failed to refresh NFTs';

        store.setState((state) => {
            state.nfts.isRefreshing = false;
            state.nfts.error = errorMessage;

            return state;
        });
    }
};
