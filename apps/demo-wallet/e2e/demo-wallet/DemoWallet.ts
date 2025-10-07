import { WalletApp } from '../qa';

export class DemoWallet extends WalletApp {
    get onboardingPage() {
        if (this.isExtension) {
            return 'chrome-extension://' + this.source + '/index.extension.html';
        }
        return this.source;
    }

    async importWallet(mnemonic: string): Promise<void> {
        if (mnemonic === '') {
            throw new Error('[importWallet] mnemonic is required setup WALLET_MNEMONIC');
        }
        const app = await this.open();
        await app.getByTestId('title').filter({ hasText: 'Setup Password', visible: true });
        await app.getByTestId('subtitle').filter({ hasText: 'Create Password', visible: true });
        await app.getByTestId('password').fill(this.password);
        await app.getByTestId('password-confirm').fill(this.password);
        await app.getByTestId('password-submit').click();
        await app.getByTestId('subtitle').filter({ hasText: 'Setup Your Wallet', visible: true });
        await app.getByTestId('import-wallet').click();
        await app.getByTestId('subtitle').filter({ hasText: 'Import Wallet', visible: true });
        await app.getByTestId('paste-all').click();
        await app.getByTestId('mnemonic').fill(mnemonic);
        await app.getByTestId('mnemonic-process').click();
        await app.getByTestId('import-wallet-process').click();
        await app.getByTestId('title').filter({ hasText: 'TON Wallet' }).waitFor({ state: 'attached' });
        await app.getByTestId('wallet-menu').click();
        await app.getByTestId('auto-lock').waitFor({ state: 'attached' });
        await app.getByTestId('auto-lock').click();
        await app.getByTestId('hold-to-sign').waitFor({ state: 'attached' });
        await app.getByTestId('hold-to-sign').click();
        await this.close();
    }

    async connectBy(url: string): Promise<void> {
        const app = await this.open();
        await app.getByTestId('tonconnect-url').fill(url);
        await app.getByTestId('tonconnect-process').click();
        await this.connect();
    }

    async connect(confirm: boolean = true): Promise<void> {
        const app = await this.open();
        const modal = app.getByTestId('request').filter({ hasText: 'Connect Request' });
        await modal.waitFor({ state: 'visible', timeout: 10_000 });
        const chose = app.getByTestId(confirm ? 'connect-approve' : 'connect-reject');
        await chose.waitFor({ state: 'attached', timeout: 10_000 });
        await chose.click();
        await this.close();
    }

    async signData(confirm: boolean = true): Promise<void> {
        const app = await this.open();
        const modal = app.getByTestId('request').filter({ hasText: 'Sign Data Request' });
        await modal.waitFor({ state: 'visible' });
        const chose = app.getByTestId(confirm ? 'sign-data-approve' : 'sign-data-reject');
        await chose.waitFor({ state: 'attached', timeout: 10_000 });
        await chose.click();
        await modal.waitFor({ state: 'detached', timeout: 10_000 });
        await this.close();
    }

    async accept(confirm: boolean = true): Promise<void> {
        const app = await this.open();
        const modal = app.getByTestId('request').filter({ hasText: 'Transaction Request' });
        await modal.waitFor({ state: 'visible', timeout: 10_000 });
        const chose = app.getByTestId(confirm ? 'send-transaction-approve' : 'send-transaction-reject');
        await chose.waitFor({ state: 'attached', timeout: 10_000 });
        await chose.click();
        await modal.waitFor({ state: 'detached', timeout: 10_000 });
        await this.close();
    }
}
