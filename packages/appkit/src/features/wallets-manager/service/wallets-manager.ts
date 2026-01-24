/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletInterface } from '../../../types/wallet';

/**
 * Manages connected wallets.
 */
export class WalletsManager {
    private _wallets: WalletInterface[];

    constructor() {
        this._wallets = [];
    }

    /**
     * All connected wallets
     */
    get wallets(): WalletInterface[] {
        return this._wallets;
    }

    /**
     * Set connected wallets
     */
    setWallets(wallets: WalletInterface[]): void {
        this._wallets = wallets;
    }
}
