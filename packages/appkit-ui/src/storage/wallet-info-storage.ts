/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletInfoWithOpenMethod } from 'src/models/connected-wallet';
import { tryGetLocalStorage } from 'src/app/utils/web-api';

export class WalletInfoStorage {
    private readonly localStorage: Storage;

    private readonly storageKey = 'ton-connect-ui_wallet-info';

    constructor() {
        this.localStorage = tryGetLocalStorage();
    }

    public setWalletInfo(walletInfo: WalletInfoWithOpenMethod): void {
        this.localStorage.setItem(this.storageKey, JSON.stringify(walletInfo));
    }

    public getWalletInfo(): WalletInfoWithOpenMethod | null {
        const walletInfoString = this.localStorage.getItem(this.storageKey);

        if (!walletInfoString) {
            return null;
        }

        return JSON.parse(walletInfoString);
    }

    public removeWalletInfo(): void {
        this.localStorage.removeItem(this.storageKey);
    }
}
