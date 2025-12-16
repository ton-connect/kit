/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { JettonError } from '@ton/walletkit';
import type { Jetton, JettonTransfer, JettonInfo } from '@ton/walletkit';

import { createComponentLogger } from '../../utils/logger';
import type { SetState, JettonsSliceCreator } from '../../types/store';

const log = createComponentLogger('JettonsSlice');

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

export const createJettonsSlice: JettonsSliceCreator = (set: SetState, get) => ({
    jettons: {
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
    },

    loadUserJettons: async (userAddress?: string) => {
        const state = get();
        const address = userAddress || state.walletManagement.address;

        if (!address) {
            log.warn('No user address available to load jettons');
            return;
        }

        if (!state.walletCore.walletKit) {
            log.warn('WalletKit not initialized');
            return;
        }

        set((state) => {
            state.jettons.isLoadingJettons = true;
            state.jettons.error = null;
        });

        try {
            log.info('Loading user jettons', { address });

            const jettonsResponse = await state.walletManagement.currentWallet?.getJettons({
                pagination: {
                    limit: 10,
                    offset: 0,
                },
            });

            if (!jettonsResponse) {
                throw new Error('Failed to load user jettons');
            }

            set((state) => {
                state.jettons.userJettons = jettonsResponse.jettons;
                state.jettons.lastJettonsUpdate = Date.now();
                state.jettons.isLoadingJettons = false;
                state.jettons.error = null;
            });

            log.info('Successfully loaded user jettons', { count: jettonsResponse.jettons.length });
        } catch (error) {
            log.error('Failed to load user jettons:', error);

            const errorMessage =
                error instanceof JettonError
                    ? `Jettons error: ${error.message} (${error.code})`
                    : error instanceof Error
                      ? error.message
                      : 'Failed to load jettons';

            set((state) => {
                state.jettons.isLoadingJettons = false;
                state.jettons.error = errorMessage;
            });
        }
    },

    refreshJettons: async (userAddress?: string) => {
        const state = get();
        const address = userAddress || state.walletManagement.address;

        if (!address) {
            return;
        }

        set((state) => {
            state.jettons.isRefreshing = true;
        });

        try {
            await get().loadUserJettons(address);
        } finally {
            set((state) => {
                state.jettons.isRefreshing = false;
            });
        }
    },

    validateJettonAddress: (address: string): boolean => {
        const state = get();
        if (!state.walletCore.walletKit) {
            log.warn('WalletKit not initialized');
            return false;
        }
        return state.walletCore.walletKit.jettons.validateJettonAddress(address);
    },

    clearJettons: () => {
        set((state) => {
            state.jettons.userJettons = [];
            state.jettons.jettonTransfers = [];
            state.jettons.popularJettons = [];
            state.jettons.isLoadingJettons = false;
            state.jettons.isLoadingTransfers = false;
            state.jettons.isLoadingPopular = false;
            state.jettons.isRefreshing = false;
            state.jettons.error = null;
            state.jettons.transferError = null;
            state.jettons.lastJettonsUpdate = 0;
            state.jettons.lastTransfersUpdate = 0;
            state.jettons.lastPopularUpdate = 0;
        });
    },

    getJettonByAddress: (jettonAddress: string): Jetton | undefined => {
        const state = get();
        return state.jettons.userJettons.find((j) => j.address === jettonAddress);
    },

    formatJettonAmount: (amount: string, decimals: number): string => {
        try {
            const amountBigInt = BigInt(amount);
            const divisor = BigInt(10 ** decimals);
            const wholePart = amountBigInt / divisor;
            const fractionalPart = amountBigInt % divisor;

            if (fractionalPart === 0n) {
                return wholePart.toString();
            }

            const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
            const trimmedFractional = fractionalStr.replace(/0+$/, '');

            return trimmedFractional ? `${wholePart}.${trimmedFractional}` : wholePart.toString();
        } catch (error) {
            log.error('Error formatting jetton amount:', error);
            return '0';
        }
    },
});
