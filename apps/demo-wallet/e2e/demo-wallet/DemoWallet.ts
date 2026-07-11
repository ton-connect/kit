/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from '@playwright/test';
import { step } from 'allure-js-commons';

import { WalletApp } from '../qa';

// const timeout = 20_000;

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
        // Fixture precondition (intentionally NOT wrapped in an allure.step, so it does not surface
        // as a "Before Hooks" node in the report): import `mnemonic`, land on the dashboard, then
        // turn OFF auto-lock and hold-to-sign so the per-type approve testids are present.
        if (mnemonic === '') {
            throw new Error('[importWallet] mnemonic is required setup WALLET_MNEMONIC');
        }
        const app = await this.open();

        // Welcome → "Add an existing wallet" → "Recovery phrase". Wait for the welcome action to
        // render — the app shows a loader until WalletKit initializes, so clicking immediately
        // after navigation races that boot. Likewise wait for the picker option to mount/animate.
        await app.getByTestId('welcome-add-existing').waitFor({ state: 'visible' });
        await app.getByTestId('welcome-add-existing').click();
        await app.getByTestId('add-wallet-import').waitFor({ state: 'visible' });
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
        await step('Paste the TON Connect link into the wallet', async () => {
            const app = await this.open();
            // Open the "Connect to dApp" modal, then paste the TON Connect link. Wait for the
            // dashboard's connect entry to be actionable (the real signal) rather than a fixed
            // pause — clicking right after the tab (re)opens otherwise races the dashboard render.
            const connectDappButton = app.getByTestId('connect-dapp-button');
            await connectDappButton.waitFor({ state: 'visible' });
            await connectDappButton.click();
            await app.getByTestId('tonconnect-url').fill(url);
            await app.getByTestId('tonconnect-process').click();

            if (shouldSkipConnect) {
                return;
            }
            await this.connect(confirm);
        });
    }

    async connect(confirm: boolean = true, skipConnect: boolean = false): Promise<void> {
        await step(confirm ? 'Approve connect request' : 'Reject connect request', async () => {
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
        });
    }

    async signData(confirm: boolean = true): Promise<void> {
        await step(confirm ? 'Approve & sign data' : 'Reject sign-data request', async () => {
            const app = await this.open();
            const modal = app.getByTestId('sign-data-request');
            await modal.waitFor({ state: 'visible' });
            const chose = app.getByTestId(confirm ? 'sign-data-approve' : 'sign-data-reject');
            await chose.waitFor({ state: 'visible' });
            await chose.click();
            await modal.waitFor({ state: 'detached' });
            await this.close();
        });
    }

    /**
     * Approve or reject a SignMessage request (the gasless path: the dApp asks the wallet
     * to sign an internal message without broadcasting it). The redesigned wallet renders
     * this as a per-type "Sign message for {dApp}" modal (`sign-message-request`; actions
     * `sign-message-approve` / `sign-message-reject`). Parity with the appkit-minter's
     * `DemoWallet.signMessage` — the two page-objects are kept split on purpose (if kit
     * moves to its own repo the object can't be shared).
     */
    async signMessage(confirm: boolean = true): Promise<void> {
        await step(confirm ? 'Approve & sign message' : 'Reject sign-message request', async () => {
            const app = await this.open();
            const modal = app.getByTestId('sign-message-request');
            await modal.waitFor({ state: 'visible' });
            const chose = app.getByTestId(confirm ? 'sign-message-approve' : 'sign-message-reject');
            await chose.waitFor({ state: 'attached' });
            await chose.click();
            await modal.waitFor({ state: 'detached' });
            await this.close();
        });
    }

    /**
     * Assert the redesigned per-type request modals' static copy + per-type action buttons WHILE
     * THE MODAL IS OPEN, without approving/rejecting. Each method waits for the type-specific modal
     * (same testid the approve method anchors on), asserts the verified static strings, and leaves
     * the page open so the matching `connect`/`accept`/`signData`/`signMessage` call can proceed.
     *
     * Only STATIC source-verified substrings are asserted (never the interpolated `{dApp}` name):
     *   - the title `<h2 data-testid="request">` static verb (e.g. "Connect to"),
     *   - a distinctive disclaimer/subtitle/section substring,
     *   - the per-type approve & reject buttons by testid.
     * Strings traced to apps/demo-wallet/src/features/ton-connect/components/*.
     */
    async expectConnectModal(): Promise<void> {
        await step('Assert connect-request modal', async () => {
            const app = await this.open();
            const modal = app.getByTestId('connect-request');
            await modal.waitFor({ state: 'visible' });

            // Title verb (connect-request-modal.tsx verb="Connect to").
            await expect(modal.getByTestId('request')).toContainText('Connect to');
            // Disclaimer (connect-request-modal.tsx disclaimer="Only connect to trusted applications. …").
            await expect(modal).toContainText('Only connect to trusted applications');
            // Per-type action buttons (connect-approve / connect-reject).
            await expect(app.getByTestId('connect-approve')).toBeVisible();
            await expect(app.getByTestId('connect-reject')).toBeVisible();
        });
    }

    async expectTransactionModal(): Promise<void> {
        await step('Assert transaction-request modal', async () => {
            const app = await this.open();
            const modal = app.getByTestId('transaction-request');
            await modal.waitFor({ state: 'visible' });

            // Title verb (transaction-request-modal.tsx verb="Confirm transaction for").
            await expect(modal.getByTestId('request')).toContainText('Confirm transaction for');
            // Subtitle (transaction-request-modal.tsx subtitle="A dApp wants to send a transaction from your wallet:").
            await expect(modal).toContainText('A dApp wants to send a transaction from your wallet');
            // "You will sign" details section (TransactionRequestDetails default title="You will sign").
            await expect(modal).toContainText('You will sign');
            // Per-type action buttons (send-transaction-approve / send-transaction-reject).
            await expect(app.getByTestId('send-transaction-approve')).toBeVisible();
            await expect(app.getByTestId('send-transaction-reject')).toBeVisible();
        });
    }

    async expectSignMessageModal(): Promise<void> {
        await step('Assert sign-message-request modal', async () => {
            const app = await this.open();
            const modal = app.getByTestId('sign-message-request');
            await modal.waitFor({ state: 'visible' });

            // Title verb (sign-message-request-modal.tsx verb="Sign message for").
            await expect(modal.getByTestId('request')).toContainText('Sign message for');
            // Subtitle about signing without broadcasting (sign-message-request-modal.tsx subtitle).
            await expect(modal).toContainText('without broadcasting it');
            // Per-type action buttons (sign-message-approve / sign-message-reject).
            await expect(app.getByTestId('sign-message-approve')).toBeVisible();
            await expect(app.getByTestId('sign-message-reject')).toBeVisible();
        });
    }

    async expectSignDataModal(): Promise<void> {
        await step('Assert sign-data-request modal', async () => {
            const app = await this.open();
            const modal = app.getByTestId('sign-data-request');
            await modal.waitFor({ state: 'visible' });

            // Title verb (sign-data-request-modal.tsx verb="Sign data for").
            await expect(modal.getByTestId('request')).toContainText('Sign data for');
            // Text-payload body label (sign-data-request-modal.tsx renderDataToSign text case "Text Message").
            await expect(modal).toContainText('Text Message');
            // Per-type action buttons (sign-data-approve / sign-data-reject).
            await expect(app.getByTestId('sign-data-approve')).toBeVisible();
            await expect(app.getByTestId('sign-data-reject')).toBeVisible();
        });
    }

    /**
     * Wait until exactly ONE of the given request-modal testids is visible and return it. Used by the
     * queue test to assert one-modal-at-a-time without depending on which request the bridge delivers
     * first. Polls until one is visible (Playwright auto-retries the OR locator via waitFor).
     */
    async waitForOneRequestModal(testIds: string[]): Promise<string> {
        return await step('Wait for a single request modal to be shown', async () => {
            const app = await this.open();
            // Resolve as soon as any of the candidate modals is visible.
            await Promise.race(testIds.map((id) => app.getByTestId(id).waitFor({ state: 'visible' })));
            const visible: string[] = [];
            for (const id of testIds) {
                if (await app.getByTestId(id).isVisible()) visible.push(id);
            }
            expect(visible.length, `exactly one request modal visible, saw: [${visible.join(', ')}]`).toBe(1);
            return visible[0]!;
        });
    }

    /**
     * Assert NONE of the given request-modal testids becomes visible. Waits a short settle window
     * first so an asynchronously-routed modal (handleTonConnectUrl is async) would have appeared —
     * `toBeHidden()` alone passes instantly and would miss a late modal.
     */
    async expectNoRequestModal(testIds: string[], settleMs: number = 1000): Promise<void> {
        await step('Assert no request modal is shown', async () => {
            const app = await this.open();
            await delay(settleMs);
            for (const id of testIds) {
                await expect(app.getByTestId(id)).toBeHidden();
            }
        });
    }

    /**
     * Approve the currently-shown request modal by its testid (one of the per-type request modals).
     * Maps the modal testid to its `*-approve` action, clicks it, and waits for the modal to detach.
     */
    async approveRequestModal(testId: string): Promise<void> {
        const approveByModal: Record<string, string> = {
            'connect-request': 'connect-approve',
            'transaction-request': 'send-transaction-approve',
            'sign-message-request': 'sign-message-approve',
            'sign-data-request': 'sign-data-approve',
        };
        const approveTestId = approveByModal[testId];
        if (!approveTestId) throw new Error(`[approveRequestModal] unknown request modal testid: ${testId}`);
        await step(`Approve ${testId}`, async () => {
            const app = await this.open();
            const modal = app.getByTestId(testId);
            const approve = app.getByTestId(approveTestId);
            await approve.waitFor({ state: 'visible' });
            await approve.click();
            await modal.waitFor({ state: 'detached' });
        });
    }

    /**
     * Assert a TON Connect REQUEST modal (`connect-request` / `transaction-request` /
     * `sign-message-request` / `sign-data-request`) is NON-dismissible: pressing Escape AND clicking
     * the backdrop must both leave it visible (only Approve/Reject close it). The shared
     * DappRequestModal renders with `dismissible={false}`, which wires `onEscapeKeyDown` /
     * `onInteractOutside` to `preventDefault` (core/components/ui/modal/modal.tsx). Leaves the modal
     * OPEN so a follow-up approve/reject can clean it up.
     */
    async expectRequestModalNotDismissible(testId: string): Promise<void> {
        await step(`Assert ${testId} modal ignores Esc + backdrop (non-dismissible)`, async () => {
            const app = await this.open();
            const modal = app.getByTestId(testId);
            await modal.waitFor({ state: 'visible' });

            // Esc must NOT close it.
            await app.keyboard.press('Escape');
            await delay(300);
            await expect(modal).toBeVisible();

            // A backdrop click (top-left corner, well outside the centered dialog content) must NOT
            // close it either. `force` + a corner point avoids hitting the modal content.
            await app.mouse.click(5, 5);
            await delay(300);
            await expect(modal).toBeVisible();
        });
    }

    /**
     * Dispatch a synthetic global `paste` ClipboardEvent on `document` carrying `text`, mimicking a
     * user pasting from the OS clipboard anywhere on the page (not into a specific field). The
     * wallet's global `usePasteHandler` listens on `document` and auto-routes TON Connect URLs
     * (tc:// / ton:// / http(s)://) to `handleTonConnectUrl` (use-paste-handler.ts). Used by the
     * global paste-routing checks.
     */
    async pasteIntoDocument(text: string): Promise<void> {
        await step('Paste text into the wallet page (global clipboard paste)', async () => {
            const app = await this.open();
            await app.evaluate((value) => {
                const dt = new DataTransfer();
                dt.setData('text', value);
                document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
            }, text);
        });
    }

    /**
     * Open the dismissible "Connect to dApp" PASTE modal (via `connect-dapp-button`) and assert it
     * IS dismissible by Escape: it must close. Unlike the request modals, ConnectDappModal uses the
     * default (`dismissible` unset → true) Modal.Container, so Radix closes it on Esc / backdrop
     * (connect-dapp-modal.tsx). The modal has no container testid, so we anchor on its unique
     * `tonconnect-url` textarea.
     */
    /** Open the Connect-to-dApp paste modal and leave it open (anchored on the `tonconnect-url` field). */
    async openPasteModal(): Promise<void> {
        await step('Open the Connect-to-dApp paste modal', async () => {
            const app = await this.open();
            await app.getByTestId('connect-dapp-button').click();
            await app.getByTestId('tonconnect-url').waitFor({ state: 'visible' });
        });
    }

    async expectPasteModalDismissibleByEsc(): Promise<void> {
        await step('Assert the Connect-to-dApp paste modal closes on Esc (dismissible)', async () => {
            const app = await this.open();
            await app.getByTestId('connect-dapp-button').click();
            const pasteField = app.getByTestId('tonconnect-url');
            await pasteField.waitFor({ state: 'visible' });

            await app.keyboard.press('Escape');
            await pasteField.waitFor({ state: 'hidden' });
            await expect(pasteField).toBeHidden();
        });
    }

    async sendTransaction(isPositiveCase: boolean, confirm: boolean, waitBeforeApprove: number = 0): Promise<void> {
        await this.open();
        if (isPositiveCase || waitBeforeApprove > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitBeforeApprove));
            await this.accept(confirm);
        }
    }

    async accept(confirm: boolean = true): Promise<void> {
        await step(confirm ? 'Approve & sign transaction' : 'Reject transaction', async () => {
            const app = await this.open();
            const modal = app.getByTestId('transaction-request');
            await modal.waitFor({ state: 'visible' });
            const chose = app.getByTestId(confirm ? 'send-transaction-approve' : 'send-transaction-reject');
            await chose.waitFor({ state: 'visible' });
            await chose.click();
            await modal.waitFor({ state: 'detached' });
            await this.close();
        });
    }

    /**
     * Send TON to own address (not via TonConnect)
     * This tests the handleNewTransaction flow with walletId
     */
    async sendTonToSelf(amount: string, confirm: boolean = true): Promise<void> {
        await step('Send TON to own address', async () => {
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
        });
    }
}
