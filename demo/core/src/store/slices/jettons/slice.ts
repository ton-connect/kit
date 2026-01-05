/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StateCreator } from 'zustand';
import type { Jetton, JettonInfo, JettonTransfer } from '@ton/walletkit';

import type { AppState } from '../../../types';

export interface JettonsState {
    userJettons: Jetton[];
    jettonTransfers: JettonTransfer[];
    popularJettons: JettonInfo[];
    isLoadingJettons: boolean;
    isLoadingTransfers: boolean;
    isLoadingPopular: boolean;
    isRefreshing: boolean;
    error: string | null;
    transferError: string | null;
    lastJettonsUpdate: number;
    lastTransfersUpdate: number;
    lastPopularUpdate: number;
}

export const createJettonsSlice: StateCreator<AppState, [], [], JettonsState> = () => ({
    userJettons: [],
    jettonTransfers: [],
    popularJettons: [],
    isLoadingJettons: false,
    isLoadingTransfers: false,
    isLoadingPopular: false,
    isRefreshing: false,
    error: null,
    transferError: null,
    lastJettonsUpdate: 0,
    lastTransfersUpdate: 0,
    lastPopularUpdate: 0,
});
