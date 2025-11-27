/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type NftItem, type NftItems } from '@ton/walletkit';

import { createComponentLogger } from '../../utils/logger';
import type { SetState, NftsSliceCreator } from '../../types/store';

const log = createComponentLogger('NftsSlice');

export interface NftsState {
    userNfts: NftItem[];
    isLoadingNfts: boolean;
    isRefreshing: boolean;
    error: string | null;
    lastNftsUpdate: number;
    hasMore: boolean;
    offset: number;
}

export const createNftsSlice: NftsSliceCreator = (set: SetState, get) => ({
    nfts: {
        userNfts: [],
        isLoadingNfts: false,
        isRefreshing: false,
        error: null,
        lastNftsUpdate: 0,
        hasMore: true,
        offset: 0,
    },

    loadUserNfts: async (userAddress?: string, limit: number = 20) => {
        const state = get();
        const address = userAddress || state.walletManagement.address;

        if (!address) {
            log.warn('No user address available to load NFTs');
            return;
        }

        if (!state.walletCore.walletKit) {
            log.warn('WalletKit not initialized');
            return;
        }

        set((state) => {
            state.nfts.isLoadingNfts = true;
            state.nfts.error = null;
        });

        try {
            log.info('Loading user NFTs', { address, limit });

            const wallets = state.walletCore.walletKit.getWallets();
            const wallet = wallets.find((w) => w.getAddress() === address);

            if (!wallet) {
                throw new Error('Wallet not found');
            }

            const result: NftItems = await wallet.getNfts({ limit, offset: 0 });

            set((state) => {
                state.nfts.userNfts = result.items;
                state.nfts.lastNftsUpdate = Date.now();
                state.nfts.isLoadingNfts = false;
                state.nfts.error = null;
                state.nfts.hasMore = result.items.length === limit;
                state.nfts.offset = result.items.length;
            });

            log.info('Successfully loaded user NFTs', { count: result.items.length });
        } catch (error) {
            log.error('Failed to load user NFTs:', error);

            const errorMessage = error instanceof Error ? error.message : 'Failed to load NFTs';

            set((state) => {
                state.nfts.isLoadingNfts = false;
                state.nfts.error = errorMessage;
            });
        }
    },

    refreshNfts: async (userAddress?: string) => {
        const state = get();
        const address = userAddress || state.walletManagement.address;

        if (!address) {
            log.warn('No user address available to refresh NFTs');
            return;
        }

        if (!state.walletCore.walletKit) {
            log.warn('WalletKit not initialized');
            return;
        }

        set((state) => {
            state.nfts.isRefreshing = true;
            state.nfts.error = null;
        });

        try {
            log.info('Refreshing user NFTs', { address });

            const wallets = state.walletCore.walletKit.getWallets();
            const wallet = wallets.find((w) => w.getAddress() === address);

            if (!wallet) {
                throw new Error('Wallet not found');
            }

            const result: NftItems = await wallet.getNfts({ limit: 20, offset: 0 });

            set((state) => {
                state.nfts.userNfts = result.items;
                state.nfts.lastNftsUpdate = Date.now();
                state.nfts.isRefreshing = false;
                state.nfts.error = null;
                state.nfts.hasMore = result.items.length === 20;
                state.nfts.offset = result.items.length;
            });

            log.info('Successfully refreshed user NFTs', { count: result.items.length });
        } catch (error) {
            log.error('Failed to refresh user NFTs:', error);

            const errorMessage = error instanceof Error ? error.message : 'Failed to refresh NFTs';

            set((state) => {
                state.nfts.isRefreshing = false;
                state.nfts.error = errorMessage;
            });
        }
    },

    loadMoreNfts: async (userAddress?: string) => {
        const state = get();
        const address = userAddress || state.walletManagement.address;

        if (!address || !state.nfts.hasMore || state.nfts.isLoadingNfts) {
            return;
        }

        if (!state.walletCore.walletKit) {
            log.warn('WalletKit not initialized');
            return;
        }

        set((state) => {
            state.nfts.isLoadingNfts = true;
            state.nfts.error = null;
        });

        try {
            log.info('Loading more user NFTs', { address, offset: state.nfts.offset });

            const wallets = state.walletCore.walletKit.getWallets();
            const wallet = wallets.find((w) => w.getAddress() === address);

            if (!wallet) {
                throw new Error('Wallet not found');
            }

            const result: NftItems = await wallet.getNfts({ limit: 20, offset: state.nfts.offset });

            set((state) => {
                state.nfts.userNfts = [...state.nfts.userNfts, ...result.items];
                state.nfts.lastNftsUpdate = Date.now();
                state.nfts.isLoadingNfts = false;
                state.nfts.error = null;
                state.nfts.hasMore = result.items.length === 20;
                state.nfts.offset = state.nfts.offset + result.items.length;
            });

            log.info('Successfully loaded more user NFTs', { count: result.items.length });
        } catch (error) {
            log.error('Failed to load more user NFTs:', error);

            const errorMessage = error instanceof Error ? error.message : 'Failed to load more NFTs';

            set((state) => {
                state.nfts.isLoadingNfts = false;
                state.nfts.error = errorMessage;
            });
        }
    },

    clearNfts: () => {
        set((state) => {
            state.nfts.userNfts = [];
            state.nfts.isLoadingNfts = false;
            state.nfts.isRefreshing = false;
            state.nfts.error = null;
            state.nfts.lastNftsUpdate = 0;
            state.nfts.hasMore = true;
            state.nfts.offset = 0;
        });
    },

    getNftByAddress: (address: string): NftItem | undefined => {
        const state = get();
        return state.nfts.userNfts.find((nft) => nft.address === address);
    },

    formatNftIndex: (index: string): string => {
        return `#${index}`;
    },
});
