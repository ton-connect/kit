/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    IntentRequestEvent,
    BatchedIntentEvent,
    TransactionIntentRequestEvent,
    SignDataIntentRequestEvent,
    ActionIntentRequestEvent,
    IntentTransactionResponse,
    IntentSignDataResponse,
} from '@ton/walletkit';
import { TonWalletKit } from '@ton/walletkit';

import { createComponentLogger } from '../../utils/logger';
import type { SetState, IntentSliceCreator } from '../../types/store';

const log = createComponentLogger('IntentSlice');

/**
 * Deep-clone an object to break Immer frozen state before passing to SDK.
 * SDK methods may mutate event objects internally.
 */
function cloneEvent<T>(obj: T): T {
    return structuredClone(obj);
}

export const createIntentSlice: IntentSliceCreator = (set: SetState, get) => ({
    intent: {
        pendingIntentEvent: undefined,
        pendingBatchedIntentEvent: undefined,
        isIntentModalOpen: false,
        isBatchedIntentModalOpen: false,
        intentResult: undefined,
        intentError: undefined,
    },

    // === Intent URL handling ===

    handleIntentUrl: async (url: string) => {
        const state = get();
        const walletKit = state.walletCore.walletKit;

        if (!walletKit) {
            throw new Error('WalletKit not initialized');
        }

        if (!(walletKit instanceof TonWalletKit)) {
            throw new Error('Intent API requires TonWalletKit instance');
        }

        const activeWallet = state.getActiveWallet();
        if (!activeWallet?.kitWalletId) {
            throw new Error('No active wallet');
        }

        try {
            log.info('Handling intent URL');
            await walletKit.handleIntentUrl(url, activeWallet.kitWalletId);
        } catch (error) {
            log.error('Failed to handle intent URL:', error);
            throw error;
        }
    },

    isIntentUrl: (url: string): boolean => {
        const state = get();
        const walletKit = state.walletCore.walletKit;
        if (!walletKit || !(walletKit instanceof TonWalletKit)) {
            return false;
        }
        return walletKit.isIntentUrl(url);
    },

    // === Show intent request (called from listener) ===

    showIntentRequest: (event: IntentRequestEvent) => {
        set((state) => {
            state.intent.pendingIntentEvent = event;
            state.intent.isIntentModalOpen = true;
            state.intent.intentResult = undefined;
            state.intent.intentError = undefined;
        });
    },

    showBatchedIntentRequest: (event: BatchedIntentEvent) => {
        set((state) => {
            state.intent.pendingBatchedIntentEvent = event;
            state.intent.isBatchedIntentModalOpen = true;
            state.intent.intentResult = undefined;
            state.intent.intentError = undefined;
        });
    },

    // === Approve / Reject ===

    approveIntent: async (): Promise<void> => {
        const state = get();
        const walletKit = state.walletCore.walletKit;
        const event = state.intent.pendingIntentEvent;

        if (!walletKit || !(walletKit instanceof TonWalletKit)) {
            throw new Error('WalletKit not initialized');
        }
        if (!event) {
            log.error('No pending intent request to approve');
            return;
        }

        const activeWallet = state.getActiveWallet();
        if (!activeWallet?.kitWalletId) {
            throw new Error('No active wallet');
        }

        try {
            let result: IntentTransactionResponse | IntentSignDataResponse;

            switch (event.type) {
                case 'transaction':
                    result = await walletKit.approveTransactionIntent(
                        cloneEvent(event.value) as TransactionIntentRequestEvent,
                        activeWallet.kitWalletId,
                    );
                    break;
                case 'signData':
                    result = await walletKit.approveSignDataIntent(
                        cloneEvent(event.value) as SignDataIntentRequestEvent,
                        activeWallet.kitWalletId,
                    );
                    break;
                case 'action':
                    result = await walletKit.approveActionIntent(
                        cloneEvent(event.value) as ActionIntentRequestEvent,
                        activeWallet.kitWalletId,
                    );
                    break;
                default:
                    throw new Error(`Unknown intent type: ${(event as IntentRequestEvent).type}`);
            }

            log.info('Intent approved successfully', { type: event.type });

            set((state) => {
                state.intent.intentResult = result;
                state.intent.pendingIntentEvent = undefined;
                state.intent.isIntentModalOpen = false;
            });
        } catch (error) {
            log.error('Failed to approve intent:', error);
            set((state) => {
                state.intent.intentError = error instanceof Error ? error.message : 'Failed to approve intent';
            });
            throw error;
        }
    },

    rejectIntent: async (reason?: string): Promise<void> => {
        const state = get();
        const walletKit = state.walletCore.walletKit;
        const event = state.intent.pendingIntentEvent;

        if (!walletKit || !(walletKit instanceof TonWalletKit)) {
            throw new Error('WalletKit not initialized');
        }
        if (!event) {
            log.error('No pending intent request to reject');
            return;
        }

        try {
            await walletKit.rejectIntent(cloneEvent(event), reason || 'User declined');
            log.info('Intent rejected');

            set((state) => {
                state.intent.pendingIntentEvent = undefined;
                state.intent.isIntentModalOpen = false;
            });
        } catch (error) {
            log.error('Failed to reject intent:', error);
        }
    },

    approveBatchedIntent: async (): Promise<void> => {
        const state = get();
        const walletKit = state.walletCore.walletKit;
        const batch = state.intent.pendingBatchedIntentEvent;

        if (!walletKit || !(walletKit instanceof TonWalletKit)) {
            throw new Error('WalletKit not initialized');
        }
        if (!batch) {
            log.error('No pending batched intent to approve');
            return;
        }

        const activeWallet = state.getActiveWallet();
        if (!activeWallet?.kitWalletId) {
            throw new Error('No active wallet');
        }

        try {
            const result = await walletKit.approveBatchedIntent(cloneEvent(batch), activeWallet.kitWalletId);
            log.info('Batched intent approved successfully');

            set((state) => {
                state.intent.intentResult = result;
                state.intent.pendingBatchedIntentEvent = undefined;
                state.intent.isBatchedIntentModalOpen = false;
            });
        } catch (error) {
            log.error('Failed to approve batched intent:', error);
            set((state) => {
                state.intent.intentError = error instanceof Error ? error.message : 'Failed to approve batched intent';
            });
            throw error;
        }
    },

    rejectBatchedIntent: async (reason?: string): Promise<void> => {
        const state = get();
        const walletKit = state.walletCore.walletKit;
        const batch = state.intent.pendingBatchedIntentEvent;

        if (!walletKit || !(walletKit instanceof TonWalletKit)) {
            throw new Error('WalletKit not initialized');
        }
        if (!batch) {
            log.error('No pending batched intent to reject');
            return;
        }

        try {
            await walletKit.rejectIntent(cloneEvent(batch), reason || 'User declined');
            log.info('Batched intent rejected');

            set((state) => {
                state.intent.pendingBatchedIntentEvent = undefined;
                state.intent.isBatchedIntentModalOpen = false;
            });
        } catch (error) {
            log.error('Failed to reject batched intent:', error);
        }
    },

    closeIntentModal: () => {
        set((state) => {
            state.intent.pendingIntentEvent = undefined;
            state.intent.isIntentModalOpen = false;
        });
    },

    closeBatchedIntentModal: () => {
        set((state) => {
            state.intent.pendingBatchedIntentEvent = undefined;
            state.intent.isBatchedIntentModalOpen = false;
        });
    },

    // === Setup intent listeners (called from walletCoreSlice) ===

    setupIntentListeners: (walletKit) => {
        if (!(walletKit instanceof TonWalletKit)) {
            log.warn('Intent listeners require TonWalletKit instance, skipping');
            return;
        }

        walletKit.onIntentRequest((event) => {
            log.info('Intent request received:', { type: 'type' in event ? event.type : 'batched' });

            // Check if it's a batched event (has `intents` array)
            if ('intents' in event) {
                get().showBatchedIntentRequest(event as BatchedIntentEvent);
            } else {
                get().showIntentRequest(event as IntentRequestEvent);
            }
        });

        log.info('Intent listeners initialized');
    },
});
