/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StateCreator } from 'zustand';
import type { NFT } from '@ton/walletkit';

import type { AppState } from '../../../types';

export interface NftsState {
    userNfts: NFT[];
    isLoadingNfts: boolean;
    isRefreshing: boolean;
    error: string | null;
    lastNftsUpdate: number;
    hasMore: boolean;
    offset: number;
}

export const createNftsSlice: StateCreator<AppState, [], [], NftsState> = () => ({
    userNfts: [],
    isLoadingNfts: false,
    isRefreshing: false,
    error: null,
    lastNftsUpdate: 0,
    hasMore: true,
    offset: 0,
});
