/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletInfoRemote } from '@ton/appkit';
import type { WalletsModalCloseReason } from 'src/models/wallets-modal';

export interface SingleWalletModal {
    /**
     * Open the modal with the specified wallet.
     */
    open: (wallet: string) => void;

    /**
     * Close the modal.
     */
    close: (closeReason?: WalletsModalCloseReason) => void;

    /**
     * Subscribe to the modal window status changes.
     */
    onStateChange: (callback: (state: SingleWalletModalState) => void) => () => void;

    /**
     * Current modal window state.
     */
    state: SingleWalletModalState;
}

/**
 * Opened modal window state.
 */
export type SingleWalletModalOpened = {
    /**
     * Modal window status.
     */
    status: 'opened';

    /**
     * Wallet info.
     */
    walletInfo: WalletInfoRemote;

    /**
     * Always `null` for opened modal window.
     */
    closeReason: null;
};

/**
 * Closed modal window state.
 */
export type SingleWalletModalClosed = {
    /**
     * Modal window status.
     */
    status: 'closed';

    /**
     * Close reason, if the modal window was closed.
     */
    closeReason: SingleWalletModalCloseReason | null;
};

/**
 * Modal window state.
 */
export type SingleWalletModalState = SingleWalletModalOpened | SingleWalletModalClosed;

/**
 * Modal window close reason.
 */
export type SingleWalletModalCloseReason = 'action-cancelled' | 'wallet-selected';
