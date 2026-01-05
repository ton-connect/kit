/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StateCreator } from 'zustand';
import type { ConnectionRequestEvent, SignDataRequestEvent, TransactionRequestEvent } from '@ton/walletkit';

import type { AppState, DisconnectNotification, RequestQueue } from '../../../types';

export interface TonConnectState {
    requestQueue: RequestQueue;
    pendingConnectRequest?: ConnectionRequestEvent;
    isConnectModalOpen: boolean;
    pendingTransactionRequest?: TransactionRequestEvent;
    isTransactionModalOpen: boolean;
    pendingSignDataRequest?: SignDataRequestEvent;
    isSignDataModalOpen: boolean;
    disconnectedSessions: DisconnectNotification[];
}

export const createTonConnectSlice: StateCreator<AppState, [], [], TonConnectState> = () => ({
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
});
