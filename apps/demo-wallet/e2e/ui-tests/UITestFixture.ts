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

import { launchPersistentContext, testWith } from '../qa';
import { isExtensionWalletSource } from '../qa/WalletApp';

export interface UITestFixture {
    context: BrowserContext;
    page: Page;
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

    return test.extend<UITestFixture>({
        context: async ({ context: _ }, use) => {
            const extensionPath = isExtension ? walletSource : '';
            const context = await launchPersistentContext(extensionPath, slowMo);
            await use(context);
            await context.close();
        },
        page: async ({ context }, use) => {
            const page = await context.newPage();
            const pageUrl = isExtension ? `chrome-extension://${walletSource}/index.extension.html` : walletSource;
            await page.goto(pageUrl, { waitUntil: 'load' });
            await use(page);
        },
    });
}

export function testWithUIFixture(config: UITestConfig = {}, slowMo = 0) {
    return testWith(uiTestFixture(config, slowMo));
}
