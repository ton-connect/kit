/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import { fileURLToPath } from 'url';

import type { BrowserContext, Page } from '@playwright/test';
import { test } from '@playwright/test';
import { feature, parentSuite, subSuite, suite, tags } from 'allure-js-commons';

import { getExtensionId, launchPersistentContext, testWith } from '../qa';
import { isExtensionWalletSource } from '../qa/WalletApp';

export interface UITestFixture {
    context: BrowserContext;
    page: Page;
    webOnly: void;
}

export interface UITestConfig {
    walletSource?: string;
}

export function detectWalletSource() {
    const source = process.env.E2E_WALLET_SOURCE ?? 'http://localhost:5173/';
    const extensionPath = process.env.E2E_WALLET_SOURCE_EXTENSION;
    if (extensionPath && extensionPath !== 'false' && extensionPath !== '0') {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const result = path.resolve(__dirname, extensionPath);
        return result;
    }
    return source;
}

export function uiTestFixture(config: UITestConfig = {}, slowMo = 0) {
    const walletSource = config.walletSource ?? detectWalletSource();
    const isExtension = isExtensionWalletSource(walletSource);

    const extended = test.extend<UITestFixture>({
        webOnly: [
            // eslint-disable-next-line no-empty-pattern
            async ({}, use) => {
                test.skip(isExtension, 'web-only: not supported in extension mode');
                await use();
            },
            { auto: false },
        ],
        context: async ({ context: _ }, use) => {
            const extensionPath = isExtension ? walletSource : '';
            const context = await launchPersistentContext(extensionPath, slowMo);
            await use(context);
            await context.close();
        },
        page: async ({ context }, use) => {
            const page = await context.newPage();
            let pageUrl: string;
            if (isExtension) {
                const extensionId = await getExtensionId(context);
                pageUrl = `chrome-extension://${extensionId}/index.extension.html`;
            } else {
                pageUrl = walletSource;
            }
            await page.goto(pageUrl, { waitUntil: 'load' });
            await use(page);
        },
    });

    // Authored suite tree (labels in code, not set by hand in the TMS): every ui-test lands
    // under Demo Wallet ▸ UI ▸ <describe>. Overrides the adapter default parent-suite, which
    // is the Playwright project name ("chromium"), and tags the run as automated so it is
    // selectable/reportable. Case identity is pinned per test via the @allure.id=<N> title
    // token, so this hook carries no binding responsibility.
    // eslint-disable-next-line no-empty-pattern
    extended.beforeEach(async ({}, testInfo) => {
        await parentSuite('Demo Wallet');
        await suite('UI');
        const fileIdx = testInfo.titlePath.findIndex((segment) => segment.endsWith('.spec.ts'));
        const describes = fileIdx >= 0 ? testInfo.titlePath.slice(fileIdx + 1, -1) : [];
        if (describes.length > 0) {
            await subSuite(describes.join(' > '));
            await feature(describes[0]);
        }
        await tags('automated');
    });

    return extended;
}

export function testWithUIFixture(config: UITestConfig = {}, slowMo = 0) {
    return testWith(uiTestFixture(config, slowMo));
}
