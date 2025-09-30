import { Page } from '@playwright/test';

import { testSelector, WalletExtension } from '../qa';

export class DemoWallet extends WalletExtension {
    get onboardingPage() {
        return 'chrome-extension://' + this.extensionId + '/index.extension.html';
    }

    async open(): Promise<Page> {
        const app = await this.context.newPage();
        await app.goto(this.onboardingPage, {
            waitUntil: 'load',
        });
        return app;
    }

    async importWallet(mnemonic: string): Promise<void> {
        const app = await this.open();
        app.locator(testSelector('title'), { hasText: 'Setup Password' });
        app.locator(testSelector('subtitle'), { hasText: 'Create Password' });
        await app.locator(testSelector('password')).fill(this.password);
        await app.locator(testSelector('password-confirm')).fill(this.password);
        await app.locator(testSelector('password-submit')).click();
        app.locator(testSelector('subtitle'), { hasText: 'Setup Your Wallet' });
        await app.locator(testSelector('import-wallet')).click();
        app.locator(testSelector('subtitle'), { hasText: 'Import Wallet' });
        await app.locator(testSelector('paste-all')).click();
        await app.locator(testSelector('mnemonic')).fill(mnemonic);
        await app.locator(testSelector('mnemonic-process')).click();
        await app.locator(testSelector('import-wallet-process')).click();
        app.locator(testSelector('title'), { hasText: 'TON Wallet' });
        await app.locator(testSelector('password-remember')).click();
        await app.close();
    }

    async connectBy(url: string): Promise<void> {
        const app = await this.open();
        await app.locator(testSelector('tonconnect-url')).fill(url);
        await app.locator(testSelector('tonconnect-process')).click();
        await app.locator(testSelector('request'), { hasText: 'Connect Request' }).waitFor({ state: 'visible' });
        await app.locator(testSelector('connect')).waitFor({ state: 'attached', timeout: 10_000 });
        await app.locator(testSelector('connect')).click();
        await app.locator(testSelector('request')).waitFor({ state: 'detached', timeout: 10_000 });
        await app.close();
    }

    async signData(confirm: boolean = true): Promise<void> {
        const app = await this.open();
        await app
            .locator(testSelector('request'), { hasText: 'Sign Data Request' })
            .waitFor({ state: 'visible', timeout: 10_000 });
        if (confirm) {
            await app.locator(testSelector('sign-data-approve')).waitFor({ state: 'attached', timeout: 10_000 });
            await app.locator(testSelector('sign-data-approve')).click();
        } else {
            await app.locator(testSelector('sign-data-reject')).click();
        }
        await app.locator(testSelector('request')).waitFor({ state: 'detached', timeout: 10_000 });
        await app.close();
    }

    async sendTransaction(confirm: boolean = true, isPositiveCase: boolean = true): Promise<void> {
        const app = await this.open();
        if (isPositiveCase) {
            await app
                .locator(testSelector('request'), { hasText: 'Transaction Request' })
                .waitFor({ state: 'visible', timeout: 10_000 });
            if (confirm) {
                await app.locator(testSelector('send-transaction-approve')).waitFor({ state: 'attached', timeout: 10_000 });
                await app.locator(testSelector('send-transaction-approve')).click();
            } else {
                await app.locator(testSelector('send-transaction-reject')).click();
            }
            await app.locator(testSelector('request')).waitFor({ state: 'detached', timeout: 10_000 });
            await app.close();
        }   
        //await app.waitForTimeout(3000);
        //await app.close();
    }

    async connect(_confirm?: boolean): Promise<void> {
        // TODO implement DemoWallet connect
        throw new Error('DemoWallet connect not implemented');
    }

    async accept(_confirm: boolean = true): Promise<void> {
        // TODO implement DemoWallet accept
        throw new Error('DemoWallet accept not implemented');
    }
}
