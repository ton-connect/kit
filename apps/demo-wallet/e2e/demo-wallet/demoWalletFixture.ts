import { test } from '@playwright/test';

import { type TestFixture, launchPersistentContext, getExtensionId, TonConnectWidget, ConfigFixture } from '../qa';
import { DemoWallet } from './DemoWallet';

export const demoWalletFixture = (config: ConfigFixture, slowMo = 0) => {
    return test.extend<TestFixture>({
        context: async ({ context: _ }, use) => {
            const context = await launchPersistentContext(config.extensionPath, slowMo);
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
            const extension = new DemoWallet(context, await getExtensionId(context));
            await extension.importWallet(config.mnemonic);
            await use(extension);
        },
    });
};
