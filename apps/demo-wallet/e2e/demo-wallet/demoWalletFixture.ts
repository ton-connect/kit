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
    return process.env.E2E_WALLET_SOURCE_EXTENSION ?? source;
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
            const pages = context.pages();
            let app = pages[pages.length - 1]; // return last tab
            if (!app) {
                app = await context.newPage();
            }
            await app.goto(config.appUrl, {
                waitUntil: 'load',
            });
            await use(app);
        },
        widget: async ({ app }, use) => {
            const widget = new TonConnectWidget(app);
            await use(widget);
        },
        wallet: async ({ context }, use) => {
            const source = isExtension ? await getExtensionId(context) : walletSource;
            const app = new DemoWallet(context, source);
            await app.importWallet(mnemonic);
            await use(app);
        },
    });
}

export function testWithDemoWalletFixture(config: ConfigFixture, slowMo = 0) {
    return testWith(demoWalletFixture(config, slowMo));
}
