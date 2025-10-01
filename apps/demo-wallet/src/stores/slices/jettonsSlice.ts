import { type AddressJetton, type JettonTransfer, type JettonInfo, JettonError } from '@ton/walletkit';

import { createComponentLogger } from '../../utils/logger';
import type { SetState, JettonsSliceCreator } from '../../types/store';
import { getWalletKit } from './walletSlice';

// Create logger for jettons slice
const log = createComponentLogger('JettonsSlice');

export interface JettonsState {
    // Data
    userJettons: AddressJetton[];
    jettonTransfers: JettonTransfer[];
    popularJettons: JettonInfo[];

    // Loading states
    isLoadingJettons: boolean;
    isLoadingTransfers: boolean;
    isLoadingPopular: boolean;
    isRefreshing: boolean;

    // Error states
    error: string | null;
    transferError: string | null;

    // Last update timestamps
    lastJettonsUpdate: number;
    lastTransfersUpdate: number;
    lastPopularUpdate: number;
}

export const createJettonsSlice: JettonsSliceCreator = (set: SetState, get) => ({
    jettons: {
        // Initial state
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

    // Actions
    loadUserJettons: async (userAddress?: string) => {
        const state = get();
        const address = userAddress || state.wallet.address;

        if (!address) {
            log.warn('No user address available to load jettons');
            return;
        }

        set((state) => {
            state.jettons.isLoadingJettons = true;
            state.jettons.error = null;
        });

        try {
            log.info('Loading user jettons', { address });

            // Use the jettons API from walletKit
            const userJettons = await getWalletKit().jettons.getAddressJettons(address);

            set((state) => {
                state.jettons.userJettons = userJettons;
                state.jettons.lastJettonsUpdate = Date.now();
                state.jettons.isLoadingJettons = false;
                state.jettons.error = null;
            });

            log.info('Successfully loaded user jettons', { count: userJettons.length });
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
        const address = userAddress || state.wallet.address;

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
        return getWalletKit().jettons.validateJettonAddress(address);
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

    // Utility methods
    getJettonByAddress: (jettonAddress: string): AddressJetton | undefined => {
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
