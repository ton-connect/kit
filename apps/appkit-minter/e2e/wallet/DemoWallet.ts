/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { WalletApp } from '../qa';

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

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

        // Welcome → "Add an existing wallet" → "Recovery phrase"
        await app.getByTestId('welcome-add-existing').click();
        await app.getByTestId('add-wallet-import').click();

        // Setup password
        await app.getByTestId('password').fill(this.password);
        await app.getByTestId('password-confirm').fill(this.password);
        await app.getByTestId('password-submit').click();

        // Import wallet screen: select mainnet, paste the phrase, continue
        await app.getByTestId('network-select-mainnet').click();
        await app.evaluate(async (m) => {
            await navigator.clipboard.writeText(m);
        }, mnemonic);
        await app.getByTestId('paste-mnemonic').click();
        await app.getByTestId('import-wallet-process').click();

        // Wait for the dashboard (the settings button only exists there)
        await app.getByTestId('wallet-menu').waitFor({ state: 'visible' });

        // Disable auto-lock and hold-to-sign for e2e tests
        await app.getByTestId('wallet-menu').click();
        await app.getByTestId('auto-lock').waitFor({ state: 'attached' });
        await app.getByTestId('auto-lock').click();
        await app.getByTestId('hold-to-sign').waitFor({ state: 'attached' });
        await app.getByTestId('hold-to-sign').click();
        await this.close();
    }

    async connectBy(url: string, shouldSkipConnect: boolean = false, confirm: boolean = true): Promise<void> {
        const app = await this.open();
        await delay(500);
        // Open the "Connect to dApp" modal, then paste the TON Connect link.
        await app.getByTestId('connect-dapp-button').click();
        await app.getByTestId('tonconnect-url').fill(url);
        await app.getByTestId('tonconnect-process').click();

        if (shouldSkipConnect) {
            return;
        }
        await this.connect(confirm);
    }

    async connect(confirm: boolean = true, skipConnect: boolean = false): Promise<void> {
        const app = await this.open();
        if (skipConnect) {
            return;
        }

        const modal = app.getByTestId('connect-request');
        await modal.waitFor({ state: 'visible' });
        const chose = app.getByTestId(confirm ? 'connect-approve' : 'connect-reject');

        await chose.waitFor({ state: 'visible' });
        await chose.click();
        await modal.waitFor({ state: 'detached' });
        await this.close();
    }

    async signData(confirm: boolean = true): Promise<void> {
        const app = await this.open();
        const modal = app.getByTestId('sign-data-request');
        await modal.waitFor({ state: 'visible' });
        const chose = app.getByTestId(confirm ? 'sign-data-approve' : 'sign-data-reject');
        await chose.waitFor({ state: 'visible' });
        await chose.click();
        await modal.waitFor({ state: 'detached' });
        await this.close();
    }

    async sendTransaction(isPositiveCase: boolean, confirm: boolean, waitBeforeApprove: number = 0): Promise<void> {
        await this.open();
        if (isPositiveCase || waitBeforeApprove > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitBeforeApprove));
            await this.accept(confirm);
        }
    }

    async accept(confirm: boolean = true): Promise<void> {
        const app = await this.open();
        const modal = app.getByTestId('transaction-request');
        await modal.waitFor({ state: 'visible' });
        const chose = app.getByTestId(confirm ? 'send-transaction-approve' : 'send-transaction-reject');
        await chose.waitFor({ state: 'visible' });
        await chose.click();
        await modal.waitFor({ state: 'detached' });
        await this.close();
    }

    /**
     * Approve or reject a SignMessage request. Gasless flows (jetton transfer / NFT mint
     * in appkit-minter) ask the wallet to sign an internal message without broadcasting it;
     * the demo wallet renders it as "Sign message for {dApp}" (modal testid
     * `sign-message-request`; actions `sign-message-approve` / `sign-message-reject`).
     *
     * @param confirm - true to sign, false to reject
     * @param waitBeforeApprove - delay before approving (lets the dApp settle into its
     *   "Sending…" state, useful for race-condition checks)
     */
    async signMessage(confirm: boolean = true, waitBeforeApprove: number = 0): Promise<void> {
        const app = await this.open();
        const modal = app.getByTestId('sign-message-request');
        await modal.waitFor({ state: 'visible' });
        if (waitBeforeApprove > 0) {
            await delay(waitBeforeApprove);
        }
        const chose = app.getByTestId(confirm ? 'sign-message-approve' : 'sign-message-reject');
        await chose.waitFor({ state: 'attached' });
        await chose.click();
        await modal.waitFor({ state: 'detached' });
        await this.close();
    }

    /**
     * Send TON to own address (not via TonConnect)
     * This tests the handleNewTransaction flow with walletId
     */
    async sendTonToSelf(amount: string, confirm: boolean = true): Promise<void> {
        const app = await this.open();

        // Navigate to send page
        await app.getByTestId('send-button').click();

        // Click "Use my address" button
        await app.getByTestId('use-my-address').click();

        // Fill in amount
        await app.getByTestId('send-amount-input').fill(amount);

        // Click send button
        await app.getByTestId('send-submit').click();

        // Wait for the transaction request modal (anchored on its type-specific action button)
        const chose = app.getByTestId(confirm ? 'send-transaction-approve' : 'send-transaction-reject');
        await chose.waitFor({ state: 'visible' });
        await chose.click();
        await chose.waitFor({ state: 'detached' });
    }
}
