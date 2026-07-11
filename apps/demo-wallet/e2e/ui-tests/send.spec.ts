/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from '@playwright/test';

import { testWithUIFixture } from './UITestFixture';
import { createWalletOnDashboard } from './helpers';
import { mockWalletApi } from '../mocks/walletApi';

const test = testWithUIFixture();

/** A syntactically valid mainnet address used as the transfer recipient. */
const VALID_RECIPIENT = 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqoY5';

test.describe('Send page form (mocked wallet API, no network send)', () => {
    test.beforeEach(async ({ webOnly: _webOnly, page }) => {
        await mockWalletApi(page);
    });

    test('@allure.id=10100 Defaults to GRAM with a token selector and "Send GRAM" submit', async ({ page }) => {
        await createWalletOnDashboard(page);
        await page.getByTestId('send-button').click();
        await expect(page.getByRole('heading', { name: 'Send' })).toBeVisible();
        // The default selected token is the native GRAM; the submit button reads "Send {symbol}".
        await expect(page.getByTestId('token-selector')).toContainText('GRAM');
        await expect(page.getByTestId('send-submit')).toHaveText('Send GRAM');
    });

    test('@allure.id=10111 Shows the fiat sub-line for the typed amount', async ({ page }) => {
        await createWalletOnDashboard(page);
        await page.getByTestId('send-button').click();
        await expect(page.getByRole('heading', { name: 'Send' })).toBeVisible();
        // The amount field renders a "≈$" fiat sub-line when the token has a rate (GRAM @ $5.20).
        await page.getByTestId('send-amount-input').fill('2');
        await expect(page.getByText('≈$', { exact: false }).first()).toBeVisible();
    });

    test('@allure.id=10105 Amount presets fill the amount field', async ({ page }) => {
        await createWalletOnDashboard(page);
        await page.getByTestId('send-button').click();
        await expect(page.getByRole('heading', { name: 'Send' })).toBeVisible();
        // The 10% / 25% / 50% / MAX presets write a computed amount into the field.
        await page.getByRole('button', { name: '50%', exact: true }).click();
        await expect(page.getByTestId('send-amount-input')).not.toHaveValue('');

        await page.getByRole('button', { name: 'MAX', exact: true }).click();
        await expect(page.getByTestId('send-amount-input')).not.toHaveValue('');
    });

    test('@allure.id=10120 Invalid recipient shows the inline "Invalid address" caption', async ({ page }) => {
        await createWalletOnDashboard(page);
        await page.getByTestId('send-button').click();
        await expect(page.getByRole('heading', { name: 'Send' })).toBeVisible();
        // A non-empty, unparseable recipient surfaces an inline validation caption (and disables submit).
        await page.getByTestId('recipient-input').fill('not-a-real-address');
        await expect(page.getByText('Invalid address', { exact: true })).toBeVisible();
    });

    test('@allure.id=10112 Amount above balance shows "Insufficient balance" on submit', async ({ page }) => {
        await createWalletOnDashboard(page);
        await page.getByTestId('send-button').click();
        await expect(page.getByRole('heading', { name: 'Send' })).toBeVisible();
        // Mock balance is 12.5 GRAM; a valid recipient + an over-balance amount reaches the submit
        // handler, which throws "Insufficient balance".
        await page.getByTestId('recipient-input').fill(VALID_RECIPIENT);
        await page.getByTestId('send-amount-input').fill('999999');
        await page.getByTestId('send-submit').click();
        await expect(page.getByText('Insufficient balance', { exact: true })).toBeVisible();
    });
});
