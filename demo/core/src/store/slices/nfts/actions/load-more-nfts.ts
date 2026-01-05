/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';
import { nftsSliceLog } from '../utils';

const PAGE_LIMIT = 20;

export const loadMoreNfts = async (userAddress?: string) => {
    const store = getStore();
    const state = store.getState();

    const address = userAddress || state.walletManagement.address;

    if (!address) {
        return;
    }

    if (!state.nfts.hasMore || state.nfts.isLoadingNfts) {
        return;
    }

    const walletKit = state.walletCore.walletKit;

    if (!walletKit) {
        nftsSliceLog.warn('WalletKit not initialized');
        return;
    }

    store.setState((state) => {
        state.nfts.isLoadingNfts = true;
        state.nfts.error = null;

        return state;
    });

    try {
        nftsSliceLog.info('Loading more user NFTs', { address, offset: state.nfts.offset });

        const wallet = walletKit.getWallets().find((w) => w.getAddress() === address);

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const result = await wallet.getNfts({
            pagination: { limit: PAGE_LIMIT, offset: state.nfts.offset },
        });

        store.setState((state) => {
            state.nfts.userNfts = [...state.nfts.userNfts, ...result.nfts];
            state.nfts.lastNftsUpdate = Date.now();
            state.nfts.isLoadingNfts = false;
            state.nfts.error = null;
            state.nfts.hasMore = result.nfts.length === PAGE_LIMIT;
            state.nfts.offset = state.nfts.offset + result.nfts.length;

            return state;
        });

        nftsSliceLog.info('Successfully loaded more user NFTs', { count: result.nfts.length });
    } catch (error) {
        nftsSliceLog.error('Failed to load more user NFTs:', error);

        const errorMessage = error instanceof Error ? error.message : 'Failed to load more NFTs';

        store.setState((state) => {
            state.nfts.isLoadingNfts = false;
            state.nfts.error = errorMessage;

            return state;
        });
    }
};
