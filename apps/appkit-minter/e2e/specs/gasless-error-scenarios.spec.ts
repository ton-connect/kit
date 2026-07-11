/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { test, expect } from '../qa/test-base';
import { gaslessMeta } from '../qa/allure-meta';

/**
 * Security checks driven purely by mocking the TonAPI gasless endpoints,
 * needing NO wallet connection. They hook the eager `/v2/gasless/config` fetch
 * that fires on load.
 *
 * Relayer error rendering that depends on a quote (40000/40007/non-BoC) and the
 * input edge cases require the gasless checkbox — i.e. a connected SignMessage
 * wallet — and therefore live in transfer.spec.ts / security.spec.ts behind the
 * two-tab fixture.
 */
test.describe('Relayer error rendering (no wallet)', () => {
    // Load-time facet of hostile config handling: a hostile config response must not
    // crash the app or execute script on boot. The render-sink facet (relayer error
    // shown as escaped text) is covered with a connected wallet in gasless-security.spec.ts.
    test('Hostile config response (HTTP 400) does not crash the app or execute script (load without wallet) @allure.id=9856', async ({
        page,
    }) => {
        await gaslessMeta('Config errors');
        await test.step('Mock config with XSS payload in the error string', async () => {
            const XSS = '<img src=x onerror=window.__xssFired=true><script>window.__xssFired2=true</script>';
            await page.route(/\/v2\/gasless\/config/, (route) =>
                route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: XSS, error_code: 40000 }),
                }),
            );

            let dialogFired = false;
            page.on('dialog', async (d) => {
                dialogFired = true;
                await d.dismiss();
            });

            await page.goto('/');
            await page.waitForLoadState('networkidle');

            expect(dialogFired, 'no alert/confirm should fire from injected error').toBe(false);
            expect(await page.evaluate(() => Boolean((window as never as { __xssFired?: boolean }).__xssFired))).toBe(
                false,
            );
            await test.step('Script/image not executed, app rendered', async () => {
                expect(
                    await page.evaluate(() => Boolean((window as never as { __xssFired2?: boolean }).__xssFired2)),
                ).toBe(false);
                await expect(page.locator('img[src="x"]')).toHaveCount(0);
                // sanity: app still rendered
                await expect(page.getByRole('button', { name: /^Mint$/ })).toBeVisible();
            });
        });
    });

    test('App loads with a config that has no supported assets (no crash) @allure.id=9859', async ({ page }) => {
        await gaslessMeta('Config errors');
        await test.step('Mock config with a valid relay address and empty gas_jettons', async () => {
            // NB: relay_address must be a checksum-valid friendly address, else the
            // walletkit config mapper throws before the empty-assets path is reached.
            await page.route(/\/v2\/gasless\/config/, (route) =>
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        relay_address: 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ',
                        gas_jettons: [],
                    }),
                }),
            );
            const pageErrors: string[] = [];
            page.on('pageerror', (e) => pageErrors.push(e.message));
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await test.step('App rendered without page errors', async () => {
                await expect(page.getByRole('button', { name: /^Mint$/ })).toBeVisible();
                expect(pageErrors).toEqual([]);
            });
        });
    });
});
