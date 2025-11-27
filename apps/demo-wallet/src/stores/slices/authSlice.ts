/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AuthSliceCreator, SetState } from '../../types/store';
import { createComponentLogger } from '../../utils/logger';

// Create logger for auth slice
const log = createComponentLogger('AuthSlice');

export const createAuthSlice: AuthSliceCreator = (set: SetState, get) => ({
    // Initial state
    auth: {
        isPasswordSet: false,
        isUnlocked: false,
        currentPassword: undefined,
        passwordHash: undefined,
        persistPassword: false,
        holdToSign: true, // Default to true for better security
        useWalletInterfaceType: 'mnemonic',
        ledgerAccountNumber: 0,
        network: 'testnet', // Default to testnet for development
    },

    // Actions
    setPassword: async (password: string) => {
        try {
            // Create a simple hash for password verification
            const passwordHashBuffer = await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(password + 'wallet_salt'),
            );

            const passwordHash = Array.from(new Uint8Array(passwordHashBuffer));

            set((state) => {
                state.auth.isPasswordSet = true;
                state.auth.isUnlocked = true;
                state.auth.currentPassword = password;
                state.auth.passwordHash = passwordHash;
            });
        } catch (error) {
            log.error('Error setting password:', error);
            throw new Error('Failed to set password');
        }
    },

    unlock: async (password: string) => {
        try {
            const state = get();
            if (!state.auth.passwordHash) return false;

            // Verify password
            const passwordHashBuffer = await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(password + 'wallet_salt'),
            );

            const currentHash = Array.from(new Uint8Array(passwordHashBuffer));
            const isValid = state.auth.passwordHash.every((byte: number, index: number) => byte === currentHash[index]);

            if (isValid) {
                set((state) => {
                    state.auth.isUnlocked = true;
                    state.auth.currentPassword = password;
                });
                return true;
            }

            return false;
        } catch (error) {
            log.error('Error unlocking wallet:', error);
            return false;
        }
    },

    lock: () => {
        // const state = get();
        set((state) => {
            state.auth.isUnlocked = false;
            state.auth.currentPassword = undefined;
        });
    },

    reset: () => {
        // const state = get();
        set((state) => {
            state.auth.isPasswordSet = false;
            state.auth.isUnlocked = false;
            state.auth.currentPassword = undefined;
            state.auth.passwordHash = undefined;
            state.auth.persistPassword = false;
            state.auth.useWalletInterfaceType = 'mnemonic';
            state.auth.ledgerAccountNumber = 0;
        });
    },

    setPersistPassword: (persist: boolean) => {
        set((state) => {
            state.auth.persistPassword = persist;
            // If disabling persistence, clear the persisted password
            if (!persist) {
                state.auth.currentPassword = undefined;
            }
        });
    },

    setHoldToSign: (enabled: boolean) => {
        set((state) => {
            state.auth.holdToSign = enabled;
        });
    },

    setUseWalletInterfaceType: (interfaceType: 'signer' | 'mnemonic' | 'ledger') => {
        set((state) => {
            state.auth.useWalletInterfaceType = interfaceType;
        });
    },

    setLedgerAccountNumber: (accountNumber: number) => {
        set((state) => {
            state.auth.ledgerAccountNumber = accountNumber;
        });
    },

    setNetwork: async (network: 'mainnet' | 'testnet') => {
        set((state) => {
            state.auth.network = network;
        });

        // Reinitialize wallet kit with new network
        const state = get();
        await state.initializeWalletKit(network);

        // Reload wallet if authenticated
        if (state.walletManagement.isAuthenticated && state.walletManagement.hasWallet) {
            await state.loadAllWallets();
        }
    },
});
