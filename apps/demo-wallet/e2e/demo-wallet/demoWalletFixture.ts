/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import { fileURLToPath } from 'url';

import { test } from '@playwright/test';

import {
    type TestFixture,
    launchPersistentContext,
    getExtensionId,
    TonConnectWidget,
    ConfigFixture,
    testWith,
} from '../qa';
import { DemoWallet } from './DemoWallet';
import { isExtensionWalletSource } from '../qa/WalletApp';

export function detectWalletSource() {
    const source = process.env.E2E_WALLET_SOURCE ?? 'http://localhost:5173/';
    if (process.env.E2E_WALLET_SOURCE_EXTENSION) {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const result = path.resolve(__dirname, process.env.E2E_WALLET_SOURCE_EXTENSION);
        return result;
    }
    return source;
}

export function demoWalletFixture(config: ConfigFixture, slowMo = 0) {
    const walletSource = config.walletSource ?? detectWalletSource();
    const isExtension = isExtensionWalletSource(walletSource);
    const mnemonic = config.mnemonic ?? process.env.WALLET_MNEMONIC;

    return test.extend<TestFixture>({
        context: async ({ context: _ }, use) => {
            const extensionPath = isExtension ? walletSource : '';
            const context = await launchPersistentContext(extensionPath, slowMo);
            await use(context);
            await context.close();
        },
        app: async ({ context }, use) => {
            // @ts-expect-error - custom property on context
            let app = context._app;
            if (!app) {
                app = await context.newPage();
                // @ts-expect-error - custom property on context
                context._app = app;
                app.onReady = await app.goto(config.appUrl, {
                    waitUntil: 'load',
                });
            }
            // const pages = context.pages();
            // context.get

            // let app; // = pages[pages.length - 1]; // return last tab
            // if (!app) {
            //     app = await context.newPage();
            // }

            await use(app);
        },
        widget: async ({ app }, use) => {
            const widget = new TonConnectWidget(app);
            await use(widget);
        },
        wallet: async ({ context }, use) => {
            const source = isExtension ? await getExtensionId(context) : walletSource;
            const app = new DemoWallet(context, source);

            const importPromise = app.importWallet(mnemonic ?? '');
            // await _app.onReady;
            await importPromise;
            await use(app);
        },
    });
}

export function testWithDemoWalletFixture(config: ConfigFixture, slowMo = 0) {
    return testWith(demoWalletFixture(config, slowMo));
}
