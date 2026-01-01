/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StateCreator } from 'zustand';

import type { AppState } from '../../../types';

export interface AuthState {
    currentPassword?: string;
    passwordHash?: number[];
    isPasswordSet?: boolean;
    isUnlocked?: boolean;
    persistPassword?: boolean;
    holdToSign?: boolean;
    useWalletInterfaceType?: 'signer' | 'mnemonic' | 'ledger';
    ledgerAccountNumber?: number;
}

export const createAuthSlice: StateCreator<AppState, [], [], AuthState> = () => ({
    isPasswordSet: false,
    isUnlocked: false,
    currentPassword: undefined,
    passwordHash: undefined,
    persistPassword: false,
    holdToSign: true, // Default to true for better security
    useWalletInterfaceType: 'mnemonic',
    ledgerAccountNumber: 0,
});
