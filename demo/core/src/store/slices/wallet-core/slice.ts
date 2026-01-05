/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StateCreator } from 'zustand';
import type { ITonWalletKit } from '@ton/walletkit';

import type { AppState } from '../../../types';

export interface WalletCoreState {
    walletKit: ITonWalletKit | null;
    walletKitInitializer: Promise<void> | null;
}

export const createWalletCoreSlice: StateCreator<AppState, [], [], WalletCoreState> = () => ({
    walletKit: null,
    walletKitInitializer: null,
});
