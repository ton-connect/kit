/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKitEmitter } from '../../../core/app-kit';
import { WALLETS_EVENTS } from '../../../core/app-kit';
import type { WalletInterface } from '../../../types/wallet';

/**
 * Manages connected wallets.
 */
export class WalletsManager {
    private _wallets: WalletInterface[];
    private _selectedWalletId: string | null;
    private emitter: AppKitEmitter;

    constructor(emitter: AppKitEmitter) {
        this._wallets = [];
        this._selectedWalletId = null;
        this.emitter = emitter;
    }

    /**
     * All connected wallets
     */
    get wallets(): WalletInterface[] {
        return this._wallets;
    }

    /**
     * Selected wallet id
     */
    get selectedWalletId(): string | null {
        return this._selectedWalletId;
    }

    /**
     * Selected wallet
     */
    get selectedWallet(): WalletInterface | null {
        if (!this._selectedWalletId) {
            return null;
        }

        return this._wallets.find((wallet) => wallet.getWalletId() === this._selectedWalletId) ?? null;
    }

    /**
     * Set selected wallet id
     */
    setSelectedWalletId(id: string | null): void {
        this._selectedWalletId = id;
    }

    /**
     * Set connected wallets
     * Automatically handles selected wallet state
     */
    setWallets(wallets: WalletInterface[]): void {
        this._wallets = wallets;

        // If currently selected wallet is still in the new list, keep it
        if (this._selectedWalletId && wallets.some((w) => w.getWalletId() === this._selectedWalletId)) {
            return;
        }

        // If list is not empty, auto-select the first one
        if (wallets.length > 0) {
            this._selectedWalletId = wallets[0].getWalletId();
            this.emitter.emit(
                WALLETS_EVENTS.SELECTION_CHANGED,
                { walletId: this._selectedWalletId },
                'wallets-manager',
            );

            return;
        }

        // Otherwise clear selection
        this._selectedWalletId = null;
        this.emitter.emit(WALLETS_EVENTS.SELECTION_CHANGED, { walletId: null }, 'wallets-manager');
    }
}
