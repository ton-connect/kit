/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { tryGetLocalStorage } from 'src/app/utils/web-api';

export class PreferredWalletStorage {
    private readonly localStorage: Storage;

    private readonly storageKey = 'ton-connect-ui_preferred-wallet';

    constructor() {
        this.localStorage = tryGetLocalStorage();
    }

    public setPreferredWalletAppName(name: string): void {
        this.localStorage.setItem(this.storageKey, name);
    }

    public getPreferredWalletAppName(): string | undefined {
        return this.localStorage.getItem(this.storageKey) || undefined;
    }
}
