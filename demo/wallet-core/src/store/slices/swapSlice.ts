/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapQuoteParams, SwapToken } from '@ton/walletkit';
import { getMaxOutgoingMessages } from '@ton/walletkit';

import { createComponentLogger } from '../../utils/logger';
import { parseUnits } from '../../utils/units';
import type { SetState, SwapSliceCreator } from '../../types/store';

const log = createComponentLogger('SwapSlice');

export const createSwapSlice: SwapSliceCreator = (set: SetState, get) => ({
    swap: {
        fromToken: { address: 'ton', decimals: 9, symbol: 'TON' },
        toToken: { address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', decimals: 6, symbol: 'USDT' },
        amount: '',
        destinationAddress: '',
        currentQuote: null,
        isLoadingQuote: false,
        isSwapping: false,
        error: null,
        slippageBps: 100,
        isReverseSwap: false,
    },

    setFromToken: (token: SwapToken) => {
        set((state) => {
            state.swap.fromToken = token;
            state.swap.currentQuote = null;
            state.swap.amount = '';
        });
    },

    setToToken: (token: SwapToken) => {
        set((state) => {
            state.swap.toToken = token;
            state.swap.currentQuote = null;
            state.swap.amount = '';
        });
    },

    setIsReverseSwap: (isReverseSwap: boolean) => {
        set((state) => {
            state.swap.isReverseSwap = isReverseSwap;
        });
    },

    setAmount: (amount: string) => {
        set((state) => {
            // Allow empty string or valid number input
            if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
                state.swap.amount = amount;
                state.swap.currentQuote = null;
                state.swap.error = null;
            }
        });
    },

    setDestinationAddress: (address: string) => {
        set((state) => {
            state.swap.destinationAddress = address;
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

            state.swap.amount = '';
            state.swap.fromToken = state.swap.toToken;
            state.swap.toToken = tempToken;
            state.swap.currentQuote = null;
            state.swap.error = null;
        });
    },

    validateSwapInputs: () => {
        const state = get();
        const { fromToken, toToken, amount } = state.swap;

        // Check if tokens are selected
        if (!fromToken) {
            return 'Please select a token to swap from';
        }

        if (!toToken) {
            return 'Please select a token to swap to';
        }

        // Check if tokens are the same
        if (fromToken === toToken) {
            return 'Cannot swap the same token';
        }

        // Check if at least one amount is entered
        if (!amount || amount === '') {
            return 'Please enter an amount';
        }

        // Validate the amount that is entered
        const amountToValidate = parseFloat(amount);

        if (isNaN(amountToValidate)) {
            return 'Please enter a valid number';
        }

        // Check if amount is positive
        if (amountToValidate <= 0) {
            return 'Amount must be greater than 0';
        }

        // Check balance
        const tonBalanceStr = state.walletManagement.balance;

        if (!tonBalanceStr) {
            return 'Insufficient balance for gas fees';
        }

        const tonBalance = BigInt(tonBalanceStr);

        if (fromToken.address === 'ton') {
            const amountBigInt = parseUnits(amount, fromToken.decimals);

            if (amountBigInt > tonBalance) {
                return 'Insufficient balance';
            }
        } else {
            // Check jetton balance
            const jetton = state.jettons.userJettons.find((j) => j.address === fromToken.address);

            if (!jetton || !jetton.balance) {
                return 'Insufficient balance';
            }

            const amountBigInt = parseUnits(amount, fromToken.decimals);
            const jettonBalance = BigInt(jetton.balance);

            if (amountBigInt > jettonBalance) {
                return 'Insufficient balance';
            }
        }

        return null;
    },

    getQuote: async () => {
        const state = get();
        const { fromToken, toToken, amount, isReverseSwap, slippageBps } = state.swap;

        // Validate inputs
        const validationError = get().validateSwapInputs();
        if (validationError) {
            log.warn('Validation failed', { validationError });
            set((state) => {
                state.swap.error = validationError;
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

        const network = await state.walletManagement.currentWallet?.getNetwork();

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
            log.info('Getting swap quote', { fromToken, toToken, amount, isReverseSwap });

            let maxOutgoingMessages = 1;

            if (state.walletManagement.currentWallet?.getSupportedFeatures) {
                maxOutgoingMessages = getMaxOutgoingMessages(
                    await state.walletManagement.currentWallet?.getSupportedFeatures(),
                );
            }

            // Determine which amount to use (pass human-readable amount, provider handles conversion)
            let quoteParams: SwapQuoteParams;
            if (isReverseSwap) {
                quoteParams = {
                    from: fromToken,
                    to: toToken,
                    network: network,
                    slippageBps,
                    maxOutgoingMessages,
                    amount,
                    isReverseSwap: true,
                };
            } else {
                quoteParams = {
                    from: fromToken,
                    to: toToken,
                    network,
                    slippageBps,
                    maxOutgoingMessages,
                    amount,
                    isReverseSwap: false,
                };
            }

            const quote = await state.walletCore.walletKit.swap.getQuote(quoteParams, 'omniston');

            // Update the opposite amount based on which one was specified
            set((state) => {
                state.swap.currentQuote = quote;
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
                state.swap.amount = '';
            });
        }
    },

    executeSwap: async () => {
        const state = get();
        const { currentQuote } = state.swap;

        // Validate inputs
        const validationError = get().validateSwapInputs();
        if (validationError) {
            log.warn('Validation failed', { validationError });
            set((state) => {
                state.swap.error = validationError;
            });
            return;
        }

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
                    destinationAddress: state.swap.destinationAddress || undefined,
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
                state.swap.amount = '';
                state.swap.currentQuote = null;
                state.swap.isReverseSwap = false;
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
            state.swap.fromToken = { address: 'ton', decimals: 9, symbol: 'TON' };
            state.swap.toToken = {
                address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
                decimals: 6,
                symbol: 'USDT',
            };
            state.swap.amount = '';
            state.swap.currentQuote = null;
            state.swap.isLoadingQuote = false;
            state.swap.isSwapping = false;
            state.swap.error = null;
            state.swap.slippageBps = 100;
            state.swap.isReverseSwap = false;
        });
    },
});
