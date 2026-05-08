/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Jetton, SwapQuoteParams, SwapToken, TransactionRequest } from '@ton/walletkit';
import { getMaxOutgoingMessages, getTransactionStatus } from '@ton/walletkit';

import { createComponentLogger } from '../../utils/logger';
import { parseUnits } from '../../utils/units';
import type { SetState, SwapSliceCreator } from '../../types/store';

const log = createComponentLogger('SwapSlice');

const POLL_INTERVAL_MS = 300;
const POLL_TIMEOUT_MS = 30_000;

/**
 * Resolve a human-readable symbol for a SwapToken used in receipts/toasts.
 * Prefers the symbol baked into the token, then matches a known jetton by
 * address, then falls back to a sibling token (e.g. the slice's own
 * `fromToken`/`toToken`) whose symbol is more likely to be set, then
 * `'Unknown'` as a last resort.
 */
function getTokenSymbol(token: SwapToken, userJettons: Jetton[] = [], fallback?: SwapToken): string {
    if (token.symbol) return token.symbol;
    if (token.address === 'ton') return 'TON';

    const jetton = userJettons.find((j) => j.address === token.address);
    if (jetton?.info?.symbol) return jetton.info.symbol;

    if (fallback && fallback.address === token.address && fallback.symbol) {
        return fallback.symbol;
    }

    return 'Unknown';
}

function generateSwapId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

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
        preparedTransaction: null,
        isPreparingTransaction: false,
        lastSwapHash: null,
        swapStartedAt: null,
        lastSwapNotificationId: null,
        lastSwapStatus: 'idle',
        lastSwapDurationMs: null,
        lastSwapReceipt: null,
        lastSwapErrorMessage: null,
    },

    setFromToken: (token: SwapToken) => {
        set((state) => {
            state.swap.fromToken = token;
            state.swap.currentQuote = null;
            state.swap.preparedTransaction = null;
            state.swap.amount = '';
        });
    },

    setToToken: (token: SwapToken) => {
        set((state) => {
            state.swap.toToken = token;
            state.swap.currentQuote = null;
            state.swap.preparedTransaction = null;
            state.swap.amount = '';
        });
    },

    setIsReverseSwap: (isReverseSwap: boolean) => {
        set((state) => {
            state.swap.isReverseSwap = isReverseSwap;
        });
    },

    setSwapAmount: (amount: string) => {
        set((state) => {
            // Allow empty string or valid number input
            if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
                state.swap.amount = amount;
                state.swap.currentQuote = null;
                state.swap.preparedTransaction = null;
                state.swap.error = null;
            }
        });
    },

    setDestinationAddress: (address: string) => {
        set((state) => {
            state.swap.destinationAddress = address;
            state.swap.preparedTransaction = null;
        });
    },

    setSlippageBps: (slippage: number) => {
        set((state) => {
            state.swap.slippageBps = slippage;
            state.swap.currentQuote = null;
            state.swap.preparedTransaction = null;
        });
    },

    swapTokens: () => {
        set((state) => {
            const tempToken = state.swap.fromToken;

            state.swap.amount = '';
            state.swap.fromToken = state.swap.toToken;
            state.swap.toToken = tempToken;
            state.swap.currentQuote = null;
            state.swap.preparedTransaction = null;
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

    getSwapQuote: async () => {
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
            log.info('Getting swap quote', { fromToken, toToken, amount, isReverseSwap });

            let maxOutgoingMessages = 1;

            const walletSupportedFeatures = state.walletManagement.currentWallet?.getSupportedFeatures();

            if (walletSupportedFeatures) {
                maxOutgoingMessages = getMaxOutgoingMessages(walletSupportedFeatures);
            }

            // Determine which amount to use (pass human-readable amount, provider handles conversion)
            let quoteParams: SwapQuoteParams;
            if (isReverseSwap) {
                quoteParams = {
                    from: fromToken,
                    to: toToken,
                    network,
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
                state.swap.preparedTransaction = null;
                state.swap.isLoadingQuote = false;
                state.swap.error = null;
            });

            log.info('Successfully got swap quote', { quote });

            // Pre-build the transaction in the background so the hold-to-sign gesture
            // signs immediately without an extra round-trip.
            void get().prepareSwapTransaction();
        } catch (error) {
            log.error('Failed to get swap quote:', error);

            const errorMessage = error instanceof Error ? error.message : 'Failed to get swap quote';

            set((state) => {
                state.swap.isLoadingQuote = false;
                state.swap.error = errorMessage;
                state.swap.currentQuote = null;
                state.swap.preparedTransaction = null;
                state.swap.amount = '';
            });
        }
    },

    prepareSwapTransaction: async () => {
        const state = get();
        const { currentQuote, destinationAddress } = state.swap;

        if (!currentQuote) {
            return;
        }

        if (!state.walletCore.walletKit) {
            return;
        }

        if (!state.walletManagement.address) {
            return;
        }

        // Capture the quote we are building for so we can detect a stale build
        const quoteAtRequest = currentQuote;

        set((state) => {
            state.swap.isPreparingTransaction = true;
        });

        try {
            const transaction = await state.walletCore.walletKit.swap.buildSwapTransaction({
                quote: currentQuote,
                userAddress: state.walletManagement.address,
                destinationAddress: destinationAddress || undefined,
            });

            // If the quote changed while we were building, drop this prepared tx.
            const latest = get().swap.currentQuote;
            if (latest !== quoteAtRequest) {
                set((state) => {
                    state.swap.isPreparingTransaction = false;
                });
                return;
            }

            set((state) => {
                state.swap.preparedTransaction = transaction;
                state.swap.isPreparingTransaction = false;
            });

            log.info('Pre-built swap transaction');
        } catch (error) {
            log.error('Failed to pre-build swap transaction:', error);
            set((state) => {
                state.swap.preparedTransaction = null;
                state.swap.isPreparingTransaction = false;
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
            return null;
        }

        if (!currentQuote) {
            log.warn('No quote available for swap');
            set((state) => {
                state.swap.error = 'No quote available. Please get a quote first.';
            });
            return null;
        }

        if (!state.walletCore.walletKit) {
            log.warn('WalletKit not initialized');
            set((state) => {
                state.swap.error = 'WalletKit not initialized';
            });
            return null;
        }

        if (!state.walletManagement.currentWallet) {
            log.warn('No active wallet');
            set((state) => {
                state.swap.error = 'No active wallet';
            });
            return null;
        }

        if (!state.walletManagement.address) {
            log.warn('No wallet address');
            set((state) => {
                state.swap.error = 'No wallet address';
            });
            return null;
        }

        set((state) => {
            state.swap.isSwapping = true;
            state.swap.error = null;
        });

        try {
            log.info('Executing swap', { quote: currentQuote });

            // Use the pre-built transaction if available, otherwise build inline as a fallback.
            let transaction: TransactionRequest | null = state.swap.preparedTransaction;
            if (!transaction) {
                log.info('No prepared transaction, building inline');
                transaction = await state.walletCore.walletKit.swap.buildSwapTransaction({
                    quote: currentQuote,
                    userAddress: state.walletManagement.address,
                    destinationAddress: state.swap.destinationAddress || undefined,
                });
            }

            const swapStartedAt = Date.now();
            const notificationId = generateSwapId();
            const userJettons = state.jettons.userJettons;
            const receipt = {
                fromSymbol: getTokenSymbol(currentQuote.fromToken, userJettons, state.swap.fromToken),
                fromAmount: currentQuote.fromAmount,
                toSymbol: getTokenSymbol(currentQuote.toToken, userJettons, state.swap.toToken),
                toAmount: currentQuote.toAmount,
            };

            // Mark broadcasting state up-front so any UI listener can react immediately.
            set((state) => {
                state.swap.swapStartedAt = swapStartedAt;
                state.swap.lastSwapNotificationId = notificationId;
                state.swap.lastSwapStatus = 'broadcasting';
                state.swap.lastSwapHash = null;
                state.swap.lastSwapDurationMs = null;
                state.swap.lastSwapReceipt = receipt;
                state.swap.lastSwapErrorMessage = null;
            });

            // Bypass the TransactionRequestModal for self-initiated swaps:
            // sign and broadcast directly through the wallet adapter.
            const { normalizedHash } = await state.walletManagement.currentWallet.sendTransaction(transaction);

            set((state) => {
                state.swap.lastSwapHash = normalizedHash;
                state.swap.lastSwapStatus = 'confirming';
                state.swap.isSwapping = false;
                // Clear the form so the next swap starts clean.
                state.swap.amount = '';
                state.swap.currentQuote = null;
                state.swap.preparedTransaction = null;
                state.swap.isReverseSwap = false;
            });

            // Watch for on-chain confirmation in the background; do NOT await,
            // so the UI can navigate immediately.
            void get().watchSwapConfirmation(normalizedHash);

            log.info('Swap broadcast successfully', { normalizedHash });
            return normalizedHash;
        } catch (error) {
            log.error('Failed to execute swap:', error);

            const errorMessage = error instanceof Error ? error.message : 'Failed to execute swap';

            set((state) => {
                state.swap.isSwapping = false;
                state.swap.error = errorMessage;
                state.swap.lastSwapStatus = 'failed';
                state.swap.lastSwapErrorMessage = errorMessage;
            });
            return null;
        }
    },

    watchSwapConfirmation: async (normalizedHash: string) => {
        const state = get();
        if (!state.walletCore.walletKit) return;

        const network = state.walletManagement.currentWallet?.getNetwork();
        if (!network) return;

        const apiClient = state.walletCore.walletKit.getApiClient(network);
        const startedAt = state.swap.swapStartedAt ?? Date.now();
        const watchedNotificationId = state.swap.lastSwapNotificationId;

        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        let elapsed = 0;
        while (elapsed < POLL_TIMEOUT_MS) {
            // Bail out if a newer swap has started or the slice was cleared.
            const current = get().swap;
            if (current.lastSwapNotificationId !== watchedNotificationId) {
                log.info('Confirmation watcher superseded by newer swap');
                return;
            }

            try {
                const status = await getTransactionStatus(apiClient, { normalizedHash });

                if (status.status === 'completed') {
                    const durationMs = Date.now() - startedAt;
                    set((state) => {
                        if (state.swap.lastSwapNotificationId !== watchedNotificationId) return;
                        state.swap.lastSwapStatus = 'completed';
                        state.swap.lastSwapDurationMs = durationMs;
                    });
                    log.info('Swap confirmed on-chain', { normalizedHash, durationMs });
                    return;
                }

                if (status.status === 'failed') {
                    set((state) => {
                        if (state.swap.lastSwapNotificationId !== watchedNotificationId) return;
                        state.swap.lastSwapStatus = 'failed';
                        state.swap.lastSwapErrorMessage = 'Transaction failed on-chain';
                    });
                    log.warn('Swap failed on-chain', { normalizedHash });
                    return;
                }
            } catch (error) {
                log.warn('Confirmation polling error (will retry)', { error });
            }

            await sleep(POLL_INTERVAL_MS);
            elapsed = Date.now() - startedAt;
        }

        set((state) => {
            if (state.swap.lastSwapNotificationId !== watchedNotificationId) return;
            state.swap.lastSwapStatus = 'timeout';
        });
        log.warn('Swap confirmation timed out', { normalizedHash });
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
            state.swap.preparedTransaction = null;
            state.swap.isPreparingTransaction = false;
            state.swap.isLoadingQuote = false;
            state.swap.isSwapping = false;
            state.swap.error = null;
            state.swap.slippageBps = 100;
            state.swap.isReverseSwap = false;
            // Note: we intentionally do NOT clear lastSwap* fields here. The
            // confirmation watcher and the toast listener still need them after
            // the swap form is cleared/unmounted on navigation to /wallet.
        });
    },
});
