/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { WalletProvider, type WalletKitConfig } from '@ton/demo-core';

import { AppRouter } from './components';

import { Toaster } from '@/components/ui/sonner';
import {
    DISABLE_HTTP_BRIDGE,
    DISABLE_NETWORK_SEND,
    ENV_BRIDGE_URL,
    ENV_TON_API_KEY_MAINNET,
    ENV_TON_API_KEY_TESTNET,
} from '@/lib/env';
import { isExtension } from '@/utils/isExtension';

import './App.css';
import './storePatch';

let jsBridgeTransport: typeof import('@/lib/extensionPopup').SendMessageToExtensionContent | undefined;
let storage: ReturnType<typeof import('@/lib/extensionPopup').CreateExtensionStorageAdapter> | undefined;

if (isExtension()) {
    const { SendMessageToExtensionContent, CreateExtensionStorageAdapter } = await import('@/lib/extensionPopup');
    jsBridgeTransport = SendMessageToExtensionContent;
    storage = CreateExtensionStorageAdapter();
}

const walletKitConfig: WalletKitConfig = {
    storage,
    jsBridgeTransport,
    disableHttpBridge: DISABLE_HTTP_BRIDGE,
    disableNetworkSend: DISABLE_NETWORK_SEND,
    bridgeUrl: ENV_BRIDGE_URL,
    tonApiKeyMainnet: ENV_TON_API_KEY_MAINNET,
    tonApiKeyTestnet: ENV_TON_API_KEY_TESTNET,
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
