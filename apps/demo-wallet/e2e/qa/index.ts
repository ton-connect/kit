/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BrowserContext } from '@playwright/test';
import { Page } from '@playwright/test';

export { TonConnectWidget } from './TonConnectWidget';
export { WalletApp } from './WalletApp';
export { launchPersistentContext, testWith } from './test';
export { getExtensionId } from './util';

export interface ConfigFixture {
    appUrl: string;
    walletSource?: string;
    mnemonic?: string;
}

import { TonConnectWidget } from './TonConnectWidget';
import { DemoWallet } from '../demo-wallet';

export type TestFixture = {
    context: BrowserContext;
    wallet: DemoWallet;
    widget: TonConnectWidget;
    app: Page;
};
