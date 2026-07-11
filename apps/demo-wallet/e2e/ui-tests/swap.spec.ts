/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from '@playwright/test';
import { step } from 'allure-js-commons';

import { testWithUIFixture } from './UITestFixture';
import { createWalletOnDashboard } from './helpers';
import { mockWalletApi } from '../mocks/walletApi';

const test = testWithUIFixture();

test.describe('Swap page form (mocked wallet API, no network send)', () => {
    test.beforeEach(async ({ webOnly: _webOnly, page }) => {
        await mockWalletApi(page);
    });

    test('@allure.id=10103 Shows From / To sides with their balances and a direction toggle', async ({ page }) => {
        await createWalletOnDashboard(page);
        await step('Open the Swap form', async () => {
            await page.getByTestId('swap-button').click();
            await expect(page.getByRole('heading', { name: 'Swap' })).toBeVisible();
        });
        await step('Verify the From / To sides show their balances and a direction toggle', async () => {
            // Defaults: From = GRAM, To = USDT. Each side shows a "Balance:" line and there is a
            // "Swap direction" button between them.
            await expect(page.getByText('From', { exact: true })).toBeVisible();
            await expect(page.getByText('To', { exact: true })).toBeVisible();
            await expect(page.getByText('Balance:', { exact: false }).first()).toBeVisible();
            await expect(page.getByRole('button', { name: 'Swap direction' })).toBeVisible();
        });
    });

    test('@allure.id=10122 Max fills the From amount keeping a gas reserve', async ({ page }) => {
        await createWalletOnDashboard(page);
        await step('Open the Swap form', async () => {
            await page.getByTestId('swap-button').click();
            await expect(page.getByRole('heading', { name: 'Swap' })).toBeVisible();
        });
        await step('Verify Max fills the From amount keeping a gas reserve', async () => {
            // The From side is the native GRAM (balance 12.5). Max writes (balance − TON_GAS_RESERVE):
            // with the component's 0.1 GRAM reserve (swap-interface.tsx TON_GAS_RESERVE) handleMaxFrom
            // sets `(12.5 - 0.1).toString()` = "12.4". The point of this test is that Max KEEPS A
            // RESERVE, so assert the written value is strictly LESS than the full balance (12.5), not
            // merely non-empty.
            const fromInput = page.locator('input[inputmode="decimal"]').first();
            await page.getByRole('button', { name: 'Max', exact: true }).first().click();
            await expect(fromInput).toHaveValue('12.4');
            // Guard the intent independently of the exact reserve constant: never the full balance.
            const written = parseFloat(await fromInput.inputValue());
            expect(written).toBeLessThan(12.5);
            expect(written).toBeGreaterThan(0);
        });
    });

    test('@allure.id=10114 Primary action reads "Get Quote" before a quote exists', async ({ page }) => {
        await createWalletOnDashboard(page);
        await step('Open the Swap form', async () => {
            await page.getByTestId('swap-button').click();
            await expect(page.getByRole('heading', { name: 'Swap' })).toBeVisible();
        });
        await step('Verify the primary action reads "Get Quote" before a quote exists', async () => {
            // With no quote yet, the primary button fetches a quote and is labelled "Get Quote".
            await expect(page.getByRole('button', { name: 'Get Quote' })).toBeVisible();
        });
    });

    test('@allure.id=10126 Reveals the custom recipient field when enabled', async ({ page }) => {
        await createWalletOnDashboard(page);
        await step('Open the Swap form', async () => {
            await page.getByTestId('swap-button').click();
            await expect(page.getByRole('heading', { name: 'Swap' })).toBeVisible();
        });
        await step('Enable "Send to a different address"', async () => {
            // The "Send to a different address" checkbox reveals a recipient input (placeholder "Recipient address (EQ…)").
            await page.getByText('Send to a different address', { exact: true }).click();
        });
        await step('Verify the custom recipient field is revealed', async () => {
            await expect(page.getByPlaceholder('Recipient address (EQ…)')).toBeVisible();
        });
    });
});
