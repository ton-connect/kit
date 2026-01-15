/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapQuote, SwapQuoteParams } from '@ton/walletkit';

import { createComponentLogger } from '../../utils/logger';
import type { SetState, SwapSliceCreator } from '../../types/store';

const log = createComponentLogger('SwapSlice');

export interface SwapState {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    currentQuote: SwapQuote | null;
    isLoadingQuote: boolean;
    isSwapping: boolean;
    error: string | null;
    slippageBps: number;
    lastQuoteUpdate: number;
}

export interface SwapSlice {
    swap: SwapState;

    setFromToken: (token: string) => void;
    setToToken: (token: string) => void;
    setFromAmount: (amount: string) => void;
    setSlippageBps: (slippage: number) => void;
    swapTokens: () => void;
    getQuote: () => Promise<void>;
    executeSwap: () => Promise<void>;
    clearSwap: () => void;
}

export const createSwapSlice: SwapSliceCreator = (set: SetState, get) => ({
    swap: {
        fromToken: 'TON',
        toToken: '',
        fromAmount: '',
        toAmount: '',
        currentQuote: null,
        isLoadingQuote: false,
        isSwapping: false,
        error: null,
        slippageBps: 100,
        lastQuoteUpdate: 0,
    },

    setFromToken: (token: string) => {
        set((state) => {
            state.swap.fromToken = token;
            state.swap.currentQuote = null;
            state.swap.toAmount = '';
        });
    },

    setToToken: (token: string) => {
        set((state) => {
            state.swap.toToken = token;
            state.swap.currentQuote = null;
            state.swap.toAmount = '';
        });
    },

    setFromAmount: (amount: string) => {
        set((state) => {
            state.swap.fromAmount = amount;
            state.swap.currentQuote = null;
            state.swap.toAmount = '';
        });
    },

    setSlippageBps: (slippage: number) => {
        set((state) => {
            state.swap.slippageBps = slippage;
        });
    },

    swapTokens: () => {
        set((state) => {
            const tempToken = state.swap.fromToken;

            state.swap.fromToken = state.swap.toToken;
            state.swap.toToken = tempToken;
            state.swap.toAmount = '';
            state.swap.currentQuote = null;
        });
    },

    getQuote: async () => {
        const state = get();
        const { fromToken, toToken, fromAmount, slippageBps } = state.swap;

        if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
            log.warn('Invalid swap parameters', { fromToken, toToken, fromAmount });
            return;
        }

        if (!state.walletCore.walletKit) {
            log.warn('WalletKit not initialized');
            set((state) => {
                state.swap.error = 'WalletKit not initialized';
            });
            return;
        }

        const network = state.walletManagement.currentWallet?.getNetwork();

        if (!network) {
            log.warn('No active wallet');
            set((state) => {
                state.swap.error = 'No active wallet';
            });
            return;
        }

        set((state) => {
            state.swap.isLoadingQuote = true;
            state.swap.error = null;
        });

        try {
            log.info('Getting swap quote', { fromToken, toToken, fromAmount });

            const decimals = fromToken === 'TON' ? 9 : 9;
            const amountInUnits = Math.floor(parseFloat(fromAmount) * Math.pow(10, decimals)).toString();

            const quoteParams: SwapQuoteParams = {
                fromToken: fromToken,
                toToken: toToken,
                amount: amountInUnits,
                network,
                slippageBps,
            };

            const quote = await state.walletCore.walletKit.swap.getQuote(quoteParams, 'omniston');

            const toDecimals = toToken === 'TON' ? 9 : 9;
            const toAmountFormatted = (parseFloat(quote.toAmount) / Math.pow(10, toDecimals)).toFixed(6);

            set((state) => {
                state.swap.currentQuote = quote;
                state.swap.toAmount = toAmountFormatted;
                state.swap.lastQuoteUpdate = Date.now();
                state.swap.isLoadingQuote = false;
                state.swap.error = null;
            });

            log.info('Successfully got swap quote', { quote });
        } catch (error) {
            log.error('Failed to get swap quote:', error);

            const errorMessage = error instanceof Error ? error.message : 'Failed to get swap quote';

            set((state) => {
                state.swap.isLoadingQuote = false;
                state.swap.error = errorMessage;
                state.swap.currentQuote = null;
                state.swap.toAmount = '';
            });
        }
    },

    executeSwap: async () => {
        const state = get();
        const { currentQuote } = state.swap;

        if (!currentQuote) {
            log.warn('No quote available for swap');
            set((state) => {
                state.swap.error = 'No quote available. Please get a quote first.';
            });
            return;
        }

        if (!state.walletCore.walletKit) {
            log.warn('WalletKit not initialized');
            set((state) => {
                state.swap.error = 'WalletKit not initialized';
            });
            return;
        }

        if (!state.walletManagement.currentWallet) {
            log.warn('No active wallet');
            set((state) => {
                state.swap.error = 'No active wallet';
            });
            return;
        }

        if (!state.walletManagement.address) {
            log.warn('No wallet address');
            set((state) => {
                state.swap.error = 'No wallet address';
            });
            return;
        }

        set((state) => {
            state.swap.isSwapping = true;
            state.swap.error = null;
        });

        try {
            log.info('Executing swap', { quote: currentQuote });

            const transaction = await state.walletCore.walletKit.swap.buildSwapTransaction(
                {
                    quote: currentQuote,
                    userAddress: state.walletManagement.address,
                },
                'omniston',
            );

            if (state.walletCore.walletKit) {
                await state.walletCore.walletKit.handleNewTransaction(
                    state.walletManagement.currentWallet,
                    transaction,
                );
            }

            set((state) => {
                state.swap.isSwapping = false;
                state.swap.fromAmount = '';
                state.swap.toAmount = '';
                state.swap.currentQuote = null;
            });

            log.info('Swap executed successfully');
        } catch (error) {
            log.error('Failed to execute swap:', error);

            const errorMessage = error instanceof Error ? error.message : 'Failed to execute swap';

            set((state) => {
                state.swap.isSwapping = false;
                state.swap.error = errorMessage;
            });
        }
    },

    clearSwap: () => {
        set((state) => {
            state.swap.fromToken = 'TON';
            state.swap.toToken = '';
            state.swap.fromAmount = '';
            state.swap.toAmount = '';
            state.swap.currentQuote = null;
            state.swap.isLoadingQuote = false;
            state.swap.isSwapping = false;
            state.swap.error = null;
            state.swap.slippageBps = 100;
            state.swap.lastQuoteUpdate = 0;
        });
    },
});
