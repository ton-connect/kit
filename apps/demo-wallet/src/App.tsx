/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { WalletProvider } from '@demo/wallet-core';
import type { WalletKitConfig } from '@demo/wallet-core';

import { AppRouter } from './components';

import { Toaster } from '@/components/ui/sonner';
import {
    DISABLE_AUTO_EMULATION,
    DISABLE_HTTP_BRIDGE,
    DISABLE_NETWORK_SEND,
    ENV_BRIDGE_URL,
    ENV_TON_API_KEY_MAINNET,
    ENV_TON_API_KEY_TESTNET,
} from '@/lib/env';
import { isExtension } from '@/utils/isExtension';
import type { SendMessageToExtensionContent, CreateExtensionStorageAdapter } from '@/lib/extensionPopup';

import './App.css';
import './storePatch';

let jsBridgeTransport: typeof SendMessageToExtensionContent | undefined;
let storage: ReturnType<typeof CreateExtensionStorageAdapter> | undefined;

if (isExtension()) {
    const { SendMessageToExtensionContent, CreateExtensionStorageAdapter } = await import('@/lib/extensionPopup');
    jsBridgeTransport = SendMessageToExtensionContent;
    storage = CreateExtensionStorageAdapter();
}

/**
 * Creates a Ledger transport for web using WebHID API
 * This is used for connecting to Ledger hardware wallets via USB
 */
const createWebLedgerTransport = () => TransportWebHID.create();

const getPlatform = (): 'ios' | 'ipad' | 'android' | 'macos' | 'windows' | 'linux' | undefined => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('ipad')) return 'ipad';
    if (ua.includes('iphone')) return 'ios';
    if (ua.includes('android')) return 'android';
    if (ua.includes('mac')) return 'macos';
    if (ua.includes('win')) return 'windows';
    if (ua.includes('linux')) return 'linux';
    return undefined;
};

const walletKitConfig: WalletKitConfig = {
    storage,
    jsBridgeTransport,
    disableHttpBridge: DISABLE_HTTP_BRIDGE,
    disableNetworkSend: DISABLE_NETWORK_SEND,
    bridgeUrl: ENV_BRIDGE_URL,
    tonApiKeyMainnet: ENV_TON_API_KEY_MAINNET,
    tonApiKeyTestnet: ENV_TON_API_KEY_TESTNET,
    createLedgerTransport: createWebLedgerTransport,
    analytics: {
        appInfo: {
            env: 'web',
            platform: getPlatform(),
            browser: navigator.userAgent,
            getLocale: () => navigator.language,
        },
    },
    disableAutoEmulation: DISABLE_AUTO_EMULATION,
};

function App() {
    return (
        <WalletProvider storage={localStorage} walletKitConfig={walletKitConfig} enableDevtools={false}>
            <AppRouter />
            <Toaster />
        </WalletProvider>
    );
}

export default App;
