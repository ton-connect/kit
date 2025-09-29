import type { BrowserContext } from '@playwright/test';
import { Page } from '@playwright/test';

export { TonConnectWidget } from './TonConnectWidget';
export { WalletExtension } from './WalletExtension';
export { launchPersistentContext, testWith } from './test';
export { getExtensionId, testSelector } from './util';

export interface ConfigFixture {
    extensionPath: string;
    mnemonic: string;
    appUrl: string;
}

import { WalletExtension } from './WalletExtension';
import { TonConnectWidget } from './TonConnectWidget';

export type TestFixture = {
    context: BrowserContext;
    wallet: WalletExtension;
    widget: TonConnectWidget;
    app: Page;
};
