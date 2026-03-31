/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StakeParams, StakingQuoteParams, UnstakeParams, UnstakeMode } from '@ton/walletkit';

import { createComponentLogger } from '../../utils/logger';
import type { SetState, StakingSliceCreator } from '../../types/store';

const log = createComponentLogger('StakingSlice');

export const createStakingSlice: StakingSliceCreator = (set: SetState, get) => ({
    staking: {
        amount: '',
        providerId: 'tonstakers',
        currentQuote: null,
        isLoadingQuote: false,
        isStaking: false,
        isUnstaking: false,
        error: null,
        unstakeMode: 'delayed',
        stakedBalance: null,
        providerInfo: null,
    },

    setStakingAmount: (amount: string) => {
        set((state) => {
            if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
                state.staking.amount = amount;
                state.staking.currentQuote = null;
                state.staking.error = null;
            }
        });
    },

    setStakingProviderId: (providerId: string) => {
        set((state) => {
            state.staking.providerId = providerId;
            state.staking.currentQuote = null;
            state.staking.error = null;
        });
    },
    setUnstakeMode: (unstakeMode: UnstakeMode) => {
        set((state) => {
            state.staking.unstakeMode = unstakeMode;
            state.staking.currentQuote = null;
            state.staking.error = null;
        });
    },

    validateStakingInputs: () => {
        const state = get();
        const { amount } = state.staking;

        if (!amount || amount === '') {
            return 'Please enter an amount';
        }

        const amountToValidate = parseFloat(amount);
        if (isNaN(amountToValidate)) {
            return 'Please enter a valid number';
        }

        if (amountToValidate <= 0) {
            return 'Amount must be greater than 0';
        }

        const tonBalanceStr = state.walletManagement.balance;
        if (!tonBalanceStr) {
            return 'Insufficient balance';
        }

        return null;
    },

    getStakingQuote: async (params: Omit<StakingQuoteParams, 'network'>) => {
        const state = get();
        const { providerId } = state.staking;

        if (!state.walletCore.walletKit) {
            set((state) => {
                state.staking.error = 'WalletKit not initialized';
            });
            return;
        }

        const network = state.walletManagement.currentWallet?.getNetwork();
        if (!network) {
            set((state) => {
                state.staking.error = 'No active wallet';
            });
            return;
        }

        set((state) => {
            state.staking.isLoadingQuote = true;
            state.staking.error = null;
        });

        try {
            const quote = await state.walletCore.walletKit.staking.getQuote(
                {
                    ...params,
                    network,
                    unstakeMode: state.staking.unstakeMode,
                },
                providerId,
            );

            set((state) => {
                state.staking.currentQuote = quote;
                state.staking.isLoadingQuote = false;
            });
        } catch (error) {
            log.error('Failed to get staking quote:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to get quote';
            set((state) => {
                state.staking.isLoadingQuote = false;
                state.staking.error = errorMessage;
            });
        }
    },

    stake: async (params: Omit<StakeParams, 'userAddress'>) => {
        const state = get();
        const { providerId } = state.staking;
        const userAddress = state.walletManagement.address;

        if (!state.walletCore.walletKit || !state.walletManagement.currentWallet || !userAddress) {
            set((state) => {
                state.staking.error = 'Wallet not ready';
            });
            return;
        }

        set((state) => {
            state.staking.isStaking = true;
            state.staking.error = null;
        });

        try {
            const transaction = await state.walletCore.walletKit.staking.buildStakeTransaction(
                {
                    ...params,
                    userAddress,
                },
                providerId,
            );

            await state.walletCore.walletKit.handleNewTransaction(state.walletManagement.currentWallet, transaction);

            set((state) => {
                state.staking.isStaking = false;
                state.staking.amount = '';
                state.staking.currentQuote = null;
            });
        } catch (error) {
            log.error('Failed to stake:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to stake';
            set((state) => {
                state.staking.isStaking = false;
                state.staking.error = errorMessage;
            });
        }
    },

    unstake: async (params: Omit<UnstakeParams, 'userAddress'>) => {
        const state = get();
        const { providerId } = state.staking;
        const userAddress = state.walletManagement.address;

        if (!state.walletCore.walletKit || !state.walletManagement.currentWallet || !userAddress) {
            set((state) => {
                state.staking.error = 'Wallet not ready';
            });
            return;
        }

        set((state) => {
            state.staking.isUnstaking = true;
            state.staking.error = null;
        });

        try {
            const transaction = await state.walletCore.walletKit.staking.buildUnstakeTransaction(
                {
                    ...params,
                    userAddress,
                },
                providerId,
            );

            await state.walletCore.walletKit.handleNewTransaction(state.walletManagement.currentWallet, transaction);

            set((state) => {
                state.staking.isUnstaking = false;
                state.staking.amount = '';
                state.staking.currentQuote = null;
            });
        } catch (error) {
            log.error('Failed to unstake:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to unstake';
            set((state) => {
                state.staking.isUnstaking = false;
                state.staking.error = errorMessage;
            });
        }
    },

    loadStakingData: async (userAddress: string) => {
        const state = get();
        const { providerId } = state.staking;

        if (!state.walletCore.walletKit) return;

        const network = state.walletManagement.currentWallet?.getNetwork();

        try {
            const [balance, info] = await Promise.all([
                state.walletCore.walletKit.staking.getStakedBalance(userAddress, network, providerId),
                state.walletCore.walletKit.staking.getStakingProviderInfo(network, providerId),
            ]);

            set((state) => {
                state.staking.stakedBalance = balance;
                state.staking.providerInfo = info;
            });
        } catch (error) {
            log.error('Failed to load staking data:', error);
        }
    },

    clearStaking: () => {
        set((state) => {
            state.staking.amount = '';
            state.staking.currentQuote = null;
            state.staking.isLoadingQuote = false;
            state.staking.isStaking = false;
            state.staking.isUnstaking = false;
            state.staking.error = null;
            state.staking.stakedBalance = null;
            state.staking.providerInfo = null;
        });
    },
});
