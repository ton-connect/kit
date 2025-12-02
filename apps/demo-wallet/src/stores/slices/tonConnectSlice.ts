/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    type EventConnectRequest,
    type EventTransactionRequest,
    type EventSignDataRequest,
    type EventDisconnect,
    type IWallet,
    SEND_TRANSACTION_ERROR_CODES,
    WalletKitError,
    ERROR_CODES,
} from '@ton/walletkit';
import { toast } from 'sonner';

import { createComponentLogger } from '../../utils/logger';
import type { QueuedRequest, QueuedRequestData, DisconnectNotification } from '../../types/wallet';
import type { SetState, TonConnectSliceCreator } from '../../types/store';

const log = createComponentLogger('TonConnectSlice');

// Queue management constants
const MAX_QUEUE_SIZE = 100;
const MODAL_CLOSE_DELAY = 500;
const REQUEST_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes

export const createTonConnectSlice: TonConnectSliceCreator = (set: SetState, get) => ({
    tonConnect: {
        requestQueue: {
            items: [],
            currentRequestId: undefined,
            isProcessing: false,
        },
        pendingConnectRequest: undefined,
        isConnectModalOpen: false,
        pendingTransactionRequest: undefined,
        isTransactionModalOpen: false,
        pendingSignDataRequest: undefined,
        isSignDataModalOpen: false,
        disconnectedSessions: [],
    },

    // TON Connect URL handling
    handleTonConnectUrl: async (url: string) => {
        const state = get();
        if (!state.walletCore.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            log.info('Handling TON Connect URL:', url);
            await state.walletCore.walletKit.handleTonConnectUrl(url);
        } catch (error) {
            log.error('Failed to handle TON Connect URL:', error);
            throw new Error('Failed to process TON Connect link');
        }
    },

    // Connect request actions
    showConnectRequest: (request: EventConnectRequest) => {
        set((state) => {
            state.tonConnect.pendingConnectRequest = request;
            state.tonConnect.isConnectModalOpen = true;
        });
    },

    approveConnectRequest: async (selectedWallet: IWallet) => {
        const state = get();
        if (!state.tonConnect.pendingConnectRequest) {
            log.error('No pending connect request to approve');
            return;
        }

        if (!state.walletCore.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            const updatedRequest: EventConnectRequest = {
                ...state.tonConnect.pendingConnectRequest,
                walletAddress: selectedWallet.getAddress(),
            };

            await state.walletCore.walletKit.approveConnectRequest(updatedRequest);

            set((state) => {
                state.tonConnect.pendingConnectRequest = undefined;
                state.tonConnect.isConnectModalOpen = false;
            });

            state.clearCurrentRequestFromQueue();
        } catch (error) {
            log.error('Failed to approve connect request:', error);
            throw error;
        }
    },

    rejectConnectRequest: async (reason?: string) => {
        const state = get();
        if (!state.tonConnect.pendingConnectRequest) {
            log.error('No pending connect request to reject');
            return;
        }

        if (!state.walletCore.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            await state.walletCore.walletKit.rejectConnectRequest(state.tonConnect.pendingConnectRequest, reason);

            set((state) => {
                state.tonConnect.pendingConnectRequest = undefined;
                state.tonConnect.isConnectModalOpen = false;
            });

            state.clearCurrentRequestFromQueue();
        } catch (error) {
            log.error('Failed to reject connect request:', error);
            throw error;
        }
    },

    closeConnectModal: () => {
        set((state) => {
            state.tonConnect.isConnectModalOpen = false;
            state.tonConnect.pendingConnectRequest = undefined;
        });
    },

    // Transaction request actions
    showTransactionRequest: (request: EventTransactionRequest) => {
        set((state) => {
            state.tonConnect.pendingTransactionRequest = request;
            state.tonConnect.isTransactionModalOpen = true;
        });
    },

    approveTransactionRequest: async () => {
        const state = get();
        if (!state.tonConnect.pendingTransactionRequest) {
            log.error('No pending transaction request to approve');
            return;
        }

        if (!state.walletCore.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            try {
                await state.walletCore.walletKit.approveTransactionRequest(state.tonConnect.pendingTransactionRequest);
                setTimeout(() => {
                    set((state) => {
                        state.tonConnect.pendingTransactionRequest = undefined;
                        state.tonConnect.isTransactionModalOpen = false;
                    });

                    state.clearCurrentRequestFromQueue();
                }, 3000);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                log.error('Failed to approve transaction request:', state.tonConnect.pendingTransactionRequest);
                if (error?.message?.toLocaleLowerCase()?.includes('ledger')) {
                    toast.error('Could not approve transaction request with Ledger, please unlock it and open TON App');
                } else {
                    toast.error('Could not approve transaction request');
                    setTimeout(() => {
                        set((state) => {
                            state.tonConnect.pendingTransactionRequest = undefined;
                            state.tonConnect.isTransactionModalOpen = false;
                        });

                        state.clearCurrentRequestFromQueue();
                    }, 3000);
                }
            }
        } catch (error) {
            log.error('Failed to approve transaction request:', error);
            throw error;
        }
    },

    rejectTransactionRequest: async (reason?: string) => {
        const state = get();
        if (!state.tonConnect.pendingTransactionRequest) {
            log.error('No pending transaction request to reject');
            return;
        }

        if (!state.walletCore.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            await state.walletCore.walletKit.rejectTransactionRequest(
                state.tonConnect.pendingTransactionRequest,
                reason,
            );

            set((state) => {
                state.tonConnect.pendingTransactionRequest = undefined;
                state.tonConnect.isTransactionModalOpen = false;
            });

            state.clearCurrentRequestFromQueue();
        } catch (error) {
            log.error('Failed to reject transaction request:', error);
            if (error instanceof WalletKitError && error.code === ERROR_CODES.SESSION_NOT_FOUND) {
                set((state) => {
                    state.tonConnect.pendingTransactionRequest = undefined;
                    state.tonConnect.isTransactionModalOpen = false;
                });
                toast.error('Could not properly reject transaction request: Session not found');

                state.clearCurrentRequestFromQueue();
                return;
            }
            throw error;
        }
    },

    closeTransactionModal: () => {
        set((state) => {
            state.tonConnect.isTransactionModalOpen = false;
            state.tonConnect.pendingTransactionRequest = undefined;
        });
    },

    // Sign data request actions
    showSignDataRequest: (request: EventSignDataRequest) => {
        set((state) => {
            state.tonConnect.pendingSignDataRequest = request;
            state.tonConnect.isSignDataModalOpen = true;
        });
    },

    approveSignDataRequest: async () => {
        const state = get();
        if (!state.tonConnect.pendingSignDataRequest) {
            log.error('No pending sign data request to approve');
            return;
        }

        if (!state.walletCore.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            await state.walletCore.walletKit.signDataRequest(state.tonConnect.pendingSignDataRequest);

            setTimeout(() => {
                set((state) => {
                    state.tonConnect.pendingSignDataRequest = undefined;
                    state.tonConnect.isSignDataModalOpen = false;
                });

                state.clearCurrentRequestFromQueue();
            }, 3000);
        } catch (error) {
            log.error('Failed to approve sign data request:', error);
            throw error;
        }
    },

    rejectSignDataRequest: async (reason?: string) => {
        const state = get();
        if (!state.tonConnect.pendingSignDataRequest) {
            log.error('No pending sign data request to reject');
            return;
        }

        if (!state.walletCore.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            await state.walletCore.walletKit.rejectSignDataRequest(state.tonConnect.pendingSignDataRequest, reason);

            set((state) => {
                state.tonConnect.pendingSignDataRequest = undefined;
                state.tonConnect.isSignDataModalOpen = false;
            });

            state.clearCurrentRequestFromQueue();
        } catch (error) {
            log.error('Failed to reject sign data request:', error);
            throw error;
        }
    },

    closeSignDataModal: () => {
        set((state) => {
            state.tonConnect.isSignDataModalOpen = false;
            state.tonConnect.pendingSignDataRequest = undefined;
        });
    },

    // Disconnect events
    handleDisconnectEvent: (event: EventDisconnect) => {
        log.info('Disconnect event received:', event);

        set((state) => {
            state.tonConnect.disconnectedSessions.push({
                walletAddress: event.walletAddress,
                reason: event.reason,
                timestamp: Date.now(),
            } as DisconnectNotification);
        });
    },

    clearDisconnectNotifications: () => {
        set((state) => {
            state.tonConnect.disconnectedSessions = [];
        });
    },

    // Queue management
    enqueueRequest: (request: QueuedRequestData) => {
        const state = get();

        const requestId = `${request.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (state.tonConnect.requestQueue.items.length >= MAX_QUEUE_SIZE) {
            log.warn('Queue is full, attempting to clear expired requests');

            get().clearExpiredRequests();

            const updatedState = get();
            if (updatedState.tonConnect.requestQueue.items.length >= MAX_QUEUE_SIZE) {
                log.error('Queue overflow: cannot add more requests');
                toast.error(
                    `Request queue is full (${MAX_QUEUE_SIZE} items). Please approve or reject pending requests.`,
                );
                return;
            }
        }

        const now = Date.now();
        const queuedRequest: QueuedRequest = {
            ...request,
            id: requestId,
            timestamp: now,
            expiresAt: now + REQUEST_EXPIRATION_TIME,
        };

        set((state) => {
            state.tonConnect.requestQueue.items.push(queuedRequest);
        });

        log.info(`Enqueued ${request.type} request`, {
            requestId,
            queueSize: state.tonConnect.requestQueue.items.length + 1,
        });

        if (!state.tonConnect.requestQueue.isProcessing) {
            get().processNextRequest();
        }
    },

    processNextRequest: () => {
        const state = get();

        if (state.tonConnect.requestQueue.isProcessing) {
            log.info('Already processing a request, skipping');
            return;
        }

        const nextRequest = state.tonConnect.requestQueue.items[0];
        if (!nextRequest) {
            log.info('No more requests in queue');
            return;
        }

        if (nextRequest.expiresAt < Date.now()) {
            log.warn('Next request has expired, removing and trying next', { requestId: nextRequest.id });
            set((state) => {
                state.tonConnect.requestQueue.items.shift();
            });
            get().processNextRequest();
            return;
        }

        log.info(`Processing ${nextRequest.type} request`, { requestId: nextRequest.id });

        set((state) => {
            state.tonConnect.requestQueue.isProcessing = true;
            state.tonConnect.requestQueue.currentRequestId = nextRequest.id;
        });

        if (nextRequest.type === 'connect') {
            get().showConnectRequest(nextRequest.request as EventConnectRequest);
        } else if (nextRequest.type === 'transaction') {
            get().showTransactionRequest(nextRequest.request as EventTransactionRequest);
        } else if (nextRequest.type === 'signData') {
            get().showSignDataRequest(nextRequest.request as EventSignDataRequest);
        }
    },

    clearExpiredRequests: () => {
        const now = Date.now();
        set((state) => {
            const originalLength = state.tonConnect.requestQueue.items.length;
            state.tonConnect.requestQueue.items = state.tonConnect.requestQueue.items.filter(
                (item) => item.expiresAt > now,
            );
            const removedCount = originalLength - state.tonConnect.requestQueue.items.length;
            if (removedCount > 0) {
                log.info(`Cleared ${removedCount} expired requests from queue`);
            }
        });
    },

    getCurrentRequest: () => {
        const state = get();
        if (!state.tonConnect.requestQueue.currentRequestId) {
            return undefined;
        }
        return state.tonConnect.requestQueue.items.find(
            (item) => item.id === state.tonConnect.requestQueue.currentRequestId,
        );
    },

    clearCurrentRequestFromQueue: () => {
        set((state) => {
            const currentId = state.tonConnect.requestQueue.currentRequestId;
            state.tonConnect.requestQueue.items = state.tonConnect.requestQueue.items.filter(
                (item) => item.id !== currentId,
            );
            state.tonConnect.requestQueue.currentRequestId = undefined;
            state.tonConnect.requestQueue.isProcessing = false;
        });

        setTimeout(() => {
            get().processNextRequest();
        }, MODAL_CLOSE_DELAY);
    },

    // Setup WalletKit event listeners (called from walletCoreSlice)
    setupTonConnectListeners: (walletKit) => {
        walletKit.onConnectRequest((event) => {
            log.info('Connect request received:', event);
            if (event?.preview?.manifestFetchErrorCode) {
                log.error(
                    'Connect request received with manifest fetch error:',
                    event?.preview?.manifestFetchErrorCode,
                );
                walletKit.rejectConnectRequest(
                    event,
                    event?.preview?.manifestFetchErrorCode == 2
                        ? 'App manifest not found'
                        : event?.preview?.manifestFetchErrorCode == 3
                          ? 'App manifest content error'
                          : undefined,
                    event.preview.manifestFetchErrorCode,
                );
                return;
            }
            get().enqueueRequest({
                type: 'connect',
                request: event,
            });
        });

        walletKit.onTransactionRequest(async (event: EventTransactionRequest) => {
            const wallet = await walletKit.getWallet(event.walletAddress ?? '');
            if (!wallet) {
                log.error('Wallet not found for transaction request');
                return;
            }

            const balance = await wallet.getBalance();
            const minNeededBalance = event.request.messages.reduce((acc, message) => acc + BigInt(message.amount), 0n);
            if (BigInt(balance) < minNeededBalance) {
                await walletKit.rejectTransactionRequest(event, {
                    code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                    message: 'Insufficient balance',
                });
                return;
            }

            get().enqueueRequest({
                type: 'transaction',
                request: event,
            });
        });

        walletKit.onSignDataRequest((event) => {
            log.info('Sign data request received:', event);
            get().enqueueRequest({
                type: 'signData',
                request: event,
            });
        });

        walletKit.onDisconnect((event) => {
            log.info('Disconnect event received:', event);
            get().handleDisconnectEvent(event);
        });

        log.info('TonConnect listeners initialized');
    },
});
