/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { test } from '@playwright/test';

import type { ConfigFixture, TestFixture } from '../qa';
import { launchPersistentContext, TonConnectWidget, testWith } from '../qa';
import { captureConsole, attachConsoleOnFailure } from '../qa/diagnostics';
import { MinterPage } from '../pages/MinterPage';
import { mockTonBalances } from '../mocks/tonBalances';
import { DemoWallet } from '../wallet';

const DEFAULT_WALLET_SOURCE = process.env.E2E_WALLET_SOURCE ?? 'http://localhost:5173/';

export type MinterFixtures = TestFixture & {
    minter: MinterPage;
};

/**
 * Two-tab fixture: tab 1 = appkit-minter (dApp under test), tab 2 = demo wallet
 * (imported from WALLET_MNEMONIC). Mirrors `demoWalletFixture` from the demo-wallet
 * e2e suite, but points `app` at the minter and adds a `minter` page object.
 *
 * Wallet-less specs (availability, mocked errors, viewports) can ignore the
 * `wallet` fixture entirely — it is lazily set up only when destructured.
 */
export function gaslessFixture(config: ConfigFixture, slowMo = 0) {
    const walletSource = config.walletSource ?? DEFAULT_WALLET_SOURCE;
    const mnemonic = config.mnemonic ?? process.env.WALLET_MNEMONIC;

    return test.extend<MinterFixtures>({
        context: async ({ context: _ }, use) => {
            const context = await launchPersistentContext('', slowMo);
            await use(context);
            await context.close();
        },
        app: async ({ context }, use, testInfo) => {
            const app = await context.newPage();
            // Hermetic account/jetton balances so the mocked gate needs no funded
            // wallet. `@real-send` specs broadcast on-chain and must read the wallet's
            // real balances, so they opt out.
            if (!testInfo.tags.includes('@real-send')) {
                await mockTonBalances(app);
            }
            const logs = captureConsole(app);
            await app.goto(config.appUrl, { waitUntil: 'load' });
            await use(app);
            await attachConsoleOnFailure(testInfo, logs);
        },
        minter: async ({ app }, use) => {
            await use(new MinterPage(app));
        },
        widget: async ({ app }, use) => {
            await use(new TonConnectWidget(app));
        },
        wallet: async ({ context }, use) => {
            const wallet = new DemoWallet(context, walletSource);
            if (!mnemonic) {
                throw new Error('WALLET_MNEMONIC is required for wallet-based specs');
            }
            await wallet.importWallet(mnemonic);
            await use(wallet);
        },
    });
}

export function testWithGaslessFixture(config: ConfigFixture, slowMo = 0) {
    return testWith(gaslessFixture(config, slowMo));
}

/**
 * Connect the demo wallet to the minter: read the universal link from the
 * TonConnect modal (clipboard) and approve it in the wallet tab.
 */
export async function connectWallet(
    { wallet, widget }: Pick<MinterFixtures, 'wallet' | 'widget'>,
    confirm = true,
): Promise<void> {
    const url = await widget.connectUrl();
    await wallet.connectBy(url, false, confirm);
}
