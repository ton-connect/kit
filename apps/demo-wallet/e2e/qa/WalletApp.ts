/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BrowserContext } from '@playwright/test';
import type { Page } from '@playwright/test';

import { TEST_PASSWORD } from '../constants';

export function isExtensionWalletSource(source: string): boolean {
    return !source.includes('http');
}

export abstract class WalletApp {
    private current?: Page;

    /**
     * Creates an instance of WalletApp
     *
     * @param context - The Playwright BrowserContext in which the extension is running
     * @param source - The ID of the extension or url web app
     * @param password - The password for the Wallet
     */
    constructor(
        readonly context: BrowserContext,
        readonly source: string,
        readonly password: string = TEST_PASSWORD,
    ) {
        this.context = context;
        this.source = source;
        this.password = password;
    }

    get isExtension(): boolean {
        return isExtensionWalletSource(this.source);
    }

    async open(): Promise<Page> {
        if (!this.current) {
            this.current = await this.context.newPage();
            // `domcontentloaded` (not `load`): the app opens long-lived connections (HMR / the
            // TON Connect bridge SSE) that can keep the `load` event from settling under two-tab
            // server contention. The React mount is gated separately by `recoverIfBlank`.
            await this.current.goto(this.onboardingPage, {
                waitUntil: 'domcontentloaded',
            });
            await this.recoverIfBlank(this.current);
        }
        return this.current;
    }

    /**
     * Reload once if the React app didn't mount. The Vite dev server occasionally serves an
     * empty shell on the very first navigation of a fresh context (its dependency optimizer is
     * still pre-bundling, especially when a sibling dev server starts at the same time), leaving
     * `#root` childless. A single reload deterministically recovers it. Best-effort: never throws,
     * so a non-dev (preview/extension) build that mounts immediately is unaffected.
     */
    private async recoverIfBlank(page: Page): Promise<void> {
        const hasContent = async (): Promise<boolean> => {
            try {
                return await page.locator('#root').evaluate((el) => el.childElementCount > 0);
            } catch {
                return false;
            }
        };
        try {
            await page.locator('#root > *').first().waitFor({ state: 'attached', timeout: 4000 });
        } catch {
            if (!(await hasContent())) {
                await page.reload({ waitUntil: 'domcontentloaded' });
                // `domcontentloaded` only means the shell HTML parsed — React hasn't necessarily
                // mounted yet. Wait for `#root` to actually have child content before returning, so
                // callers never receive an unmounted page (mirrors the first-load mount gate above).
                // Best-effort: swallow a timeout so a non-dev build that mounts instantly is unaffected.
                try {
                    await page.locator('#root > *').first().waitFor({ state: 'attached', timeout: 4000 });
                } catch {
                    // leave the page as-is; the caller's own first interaction will surface any failure
                }
            }
        }
    }

    async close(): Promise<void> {
        if (this.current) {
            await this.current.close();
            this.current = undefined;
        }
    }

    abstract get onboardingPage(): string;

    /**
     * Imports a wallet using the given seed phrase
     *
     * @param mnemonic - The seed phrase to import
     */
    abstract importWallet(mnemonic: string): Promise<void>;

    abstract connect(confirm?: boolean): Promise<void>;

    abstract connectBy(url: string): Promise<void>;

    abstract accept(confirm?: boolean): Promise<void>;

    abstract signData(confirm?: boolean): Promise<void>;
}
