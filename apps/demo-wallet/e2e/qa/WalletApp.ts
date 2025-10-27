/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BrowserContext } from '@playwright/test';
import { Page } from '@playwright/test';

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
        readonly password: string = 'tester@1234',
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
            await this.current.goto(this.onboardingPage, {
                waitUntil: 'load',
            });
        }
        return this.current;
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
