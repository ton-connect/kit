/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Page } from '@playwright/test';

export class UnlockWalletPage {
    constructor(private readonly page: Page) {}

    get title() {
        return this.page.getByTestId('title').filter({ hasText: 'Unlock Wallet' });
    }

    async waitForPage() {
        await this.title.waitFor({ state: 'visible' });
    }
}
