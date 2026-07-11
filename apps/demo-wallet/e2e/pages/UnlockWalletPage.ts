/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Page } from '@playwright/test';

/**
 * The `/unlock` screen — shown when a password is set and a wallet exists but the
 * session is locked (e.g. after a reload, since `isUnlocked` is not persisted unless
 * `persistPassword` is on). See `unlock-screen.tsx` for the exact strings/testids.
 */
export class UnlockWalletPage {
    constructor(private readonly page: Page) {}

    get passwordInput() {
        return this.page.getByTestId('password');
    }

    /** The primary "Unlock" button (shares the `password-submit` testid used across auth screens). */
    get unlockButton() {
        return this.page.getByTestId('password-submit');
    }

    /** The "Incorrect password" error shown after a failed unlock attempt. */
    get errorMessage() {
        return this.page.getByText('Incorrect password');
    }

    /** The "Reset Wallet" ghost button (no testid — located by accessible name). */
    get resetButton() {
        return this.page.getByRole('button', { name: 'Reset Wallet' });
    }

    /** The destructive "Reset" confirm button inside the reset-confirmation modal. */
    get confirmResetButton() {
        return this.page.getByRole('button', { name: 'Reset', exact: true });
    }

    async waitForPage() {
        await this.passwordInput.waitFor({ state: 'visible' });
    }

    async fillPassword(password: string) {
        await this.passwordInput.fill(password);
    }

    /** Fill the password and click Unlock. */
    async unlock(password: string) {
        await this.fillPassword(password);
        await this.unlockButton.click();
    }

    /** Open the reset-confirmation modal and confirm — resets the wallet and navigates to /welcome. */
    async resetWallet() {
        await this.resetButton.click();
        await this.confirmResetButton.waitFor({ state: 'visible' });
        await this.confirmResetButton.click();
    }
}
