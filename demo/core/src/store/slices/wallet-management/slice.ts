/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StateCreator } from 'zustand';
import type { Wallet } from '@ton/walletkit';

import type { AppState, SavedWallet } from '../../../types';

export interface WalletManagementState {
    savedWallets: SavedWallet[];
    activeWalletId?: string;
    address?: string;
    balance?: string;
    publicKey?: string;

    // Event history for active wallet
    events: unknown[];
    hasNextEvents: boolean;

    currentWallet?: Wallet;
    hasWallet: boolean;
    isAuthenticated: boolean;
}

export const createWalletManagementSlice: StateCreator<AppState, [], [], WalletManagementState> = () => ({
    savedWallets: [],
    activeWalletId: undefined,
    address: undefined,
    balance: undefined,
    publicKey: undefined,
    events: [],
    hasNextEvents: false,
    currentWallet: undefined,
    hasWallet: false,
    isAuthenticated: false,
});
