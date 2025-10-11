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
        return path.resolve(__dirname, process.env.E2E_WALLET_SOURCE_EXTENSION);
    }
    return source;
}

export function demoWalletFixture(config: ConfigFixture, slowMo = 0) {
    const walletSource = config.walletSource ?? detectWalletSource();
    const isExtension = isExtensionWalletSource(walletSource);
    const mnemonic = config.mnemonic ?? process.env.WALLET_MNEMONIC;

    // Отладочная информация
    console.log('DEBUG: config.mnemonic:', config.mnemonic);
    console.log('DEBUG: process.env.WALLET_MNEMONIC:', process.env.WALLET_MNEMONIC);
    console.log('DEBUG: final mnemonic:', mnemonic);
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
            await app.importWallet(mnemonic ?? '');
            await use(app);
        },
    });
}

export function testWithDemoWalletFixture(config: ConfigFixture, slowMo = 0) {
    return testWith(demoWalletFixture(config, slowMo));
}
