/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapQuoteParams } from '@ton/walletkit';
import { getMaxOutgoingMessages } from '@ton/walletkit';

import { createComponentLogger } from '../../utils/logger';
import { formatTon, formatUnits, parseUnits } from '../../utils/units';
import type { SetState, SwapSliceCreator } from '../../types/store';

const log = createComponentLogger('SwapSlice');

export const createSwapSlice: SwapSliceCreator = (set: SetState, get) => ({
    swap: {
        fromToken: 'TON',
        toToken: '',
        fromAmount: '',
        toAmount: '',
        destinationAddress: '',
        currentQuote: null,
        isLoadingQuote: false,
        isSwapping: false,
        error: null,
        slippageBps: 100,
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
            // Allow empty string or valid number input
            if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
                state.swap.fromAmount = amount;
                state.swap.currentQuote = null;
                state.swap.toAmount = '';
                state.swap.error = null;
            }
        });
    },

    setToAmount: (amount: string) => {
        set((state) => {
            // Allow empty string or valid number input
            if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
                state.swap.toAmount = amount;
                state.swap.currentQuote = null;
                state.swap.fromAmount = '';
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

            if (state.swap.toAmount) {
                state.swap.fromAmount = state.swap.toAmount;
                state.swap.toAmount = '';
            }

            state.swap.fromToken = state.swap.toToken;
            state.swap.toToken = tempToken;
            state.swap.currentQuote = null;
            state.swap.error = null;
        });
    },

    validateSwapInputs: () => {
        const state = get();
        const { fromToken, toToken, fromAmount, toAmount } = state.swap;

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
        if ((!fromAmount || fromAmount === '') && (!toAmount || toAmount === '')) {
            return 'Please enter an amount';
        }

        // Validate the amount that is entered
        const amountToValidate = fromAmount || toAmount;
        const amount = parseFloat(amountToValidate);
        if (isNaN(amount)) {
            return 'Please enter a valid number';
        }

        // Check if amount is positive
        if (amount <= 0) {
            return 'Amount must be greater than 0';
        }

        // Only check balance if fromAmount is specified (not when using toAmount)
        if (!fromAmount) {
            return null;
        }

        // Check balance
        if (fromToken === 'TON') {
            const balance = state.walletManagement.balance;
            if (balance) {
                const balanceInTon = parseFloat(formatTon(balance));
                const minReserve = 0.1; // Keep 0.1 TON for fees
                const maxAvailable = balanceInTon - minReserve;

                if (amount > balanceInTon) {
                    return `Insufficient balance. You have ${balanceInTon.toFixed(4)} TON`;
                }

                if (amount > maxAvailable) {
                    return `Please keep at least ${minReserve} TON for transaction fees`;
                }
            }
        } else {
            // Check jetton balance
            const jetton = state.jettons.userJettons.find((j) => j.address === fromToken);

            if (jetton && jetton.balance) {
                const decimals = jetton.decimalsNumber || 9;
                const balanceInUnits = parseFloat(formatUnits(jetton.balance, decimals));

                if (amount > balanceInUnits) {
                    return `Insufficient balance`;
                }
            } else {
                return 'Insufficient balance';
            }

            // Check TON balance for gas fees when swapping jettons
            const tonBalance = state.walletManagement.balance;
            if (tonBalance) {
                const balanceInTon = parseFloat(formatTon(tonBalance));
                const minGasReserve = 0.5; // Need at least 0.5 TON for jetton swap fees

                if (balanceInTon < minGasReserve) {
                    return `Insufficient TON for gas fees. You need at least ${minGasReserve} TON`;
                }
            } else {
                return 'Unable to check TON balance for gas fees';
            }
        }

        return null;
    },

    getQuote: async () => {
        const state = get();
        const { fromToken, toToken, fromAmount, toAmount, slippageBps } = state.swap;

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
            log.info('Getting swap quote', { fromToken, toToken, fromAmount, toAmount });

            let maxOutgoingMessages = 1;

            if (state.walletManagement.currentWallet?.getSupportedFeatures) {
                maxOutgoingMessages = getMaxOutgoingMessages(
                    state.walletManagement.currentWallet?.getSupportedFeatures(),
                );
            }

            // Determine which amount to use and convert to units
            let quoteParams: SwapQuoteParams;
            if (fromAmount) {
                const decimals = fromToken === 'TON' ? 9 : 6;
                const amountInUnits = parseUnits(fromAmount, decimals).toString();
                quoteParams = {
                    fromToken,
                    toToken,
                    network,
                    slippageBps,
                    maxOutgoingMessages,
                    amountFrom: amountInUnits,
                };
            } else {
                const decimals = toToken === 'TON' ? 9 : 6;
                const amountInUnits = parseUnits(toAmount, decimals).toString();
                quoteParams = {
                    fromToken,
                    toToken,
                    network,
                    slippageBps,
                    maxOutgoingMessages,
                    amountTo: amountInUnits,
                };
            }

            const quote = await state.walletCore.walletKit.swap.getQuote(quoteParams, 'omniston');

            // Update the opposite amount based on which one was specified
            if (fromAmount) {
                const toDecimals = toToken === 'TON' ? 9 : 6;
                const toAmountFormatted = formatUnits(quote.toAmount, toDecimals).toString();
                set((state) => {
                    state.swap.currentQuote = quote;
                    state.swap.toAmount = toAmountFormatted;
                    state.swap.isLoadingQuote = false;
                    state.swap.error = null;
                });
            } else {
                const fromDecimals = fromToken === 'TON' ? 9 : 6;
                const fromAmountFormatted = formatUnits(quote.toAmount, fromDecimals).toString();
                set((state) => {
                    state.swap.currentQuote = quote;
                    state.swap.fromAmount = fromAmountFormatted;
                    state.swap.isLoadingQuote = false;
                    state.swap.error = null;
                });
            }

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
        });
    },
});
