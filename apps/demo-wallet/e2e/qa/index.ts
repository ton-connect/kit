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

import { WalletApp } from './WalletApp';
import { TonConnectWidget } from './TonConnectWidget';

export type TestFixture = {
    context: BrowserContext;
    wallet: WalletApp;
    widget: TonConnectWidget;
    app: Page;
};
