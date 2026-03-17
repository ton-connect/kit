/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Page } from '@playwright/test';

export class SetupPasswordPage {
    constructor(private readonly page: Page) {}

    // Locators

    get title() {
        return this.page.getByTestId('title').filter({ hasText: 'Setup Password' });
    }

    get subtitle() {
        return this.page.getByTestId('subtitle');
    }

    get passwordInput() {
        return this.page.getByTestId('password');
    }

    get confirmInput() {
        return this.page.getByTestId('password-confirm');
    }

    get submitButton() {
        return this.page.getByTestId('password-submit');
    }

    get helperText() {
        return this.page.getByText('At least 4 characters');
    }

    get errorMessage() {
        return this.page.locator('[data-testid="password-error"], .text-red-600');
    }

    // Actions

    async waitForPage() {
        await this.title.waitFor({ state: 'visible' });
    }

    async fillPassword(password: string) {
        await this.passwordInput.fill(password);
    }

    async fillConfirm(password: string) {
        await this.confirmInput.fill(password);
    }

    async submit(password: string, confirm = password) {
        await this.fillPassword(password);
        await this.fillConfirm(confirm);
        await this.submitButton.click();
    }

    async submitByPasting(password: string) {
        await this.page.evaluate((pwd) => navigator.clipboard.writeText(pwd), password);
        await this.passwordInput.click();
        await this.page.keyboard.press('ControlOrMeta+v');
        await this.confirmInput.click();
        await this.page.keyboard.press('ControlOrMeta+v');
        await this.submitButton.click();
    }

    // localStorage

    async getStore() {
        return this.page.evaluate(() => JSON.parse(localStorage.getItem('demo-wallet-store') ?? '{}'));
    }
}
