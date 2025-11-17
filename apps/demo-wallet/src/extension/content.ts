/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Buffer } from 'buffer';

window.Buffer = Buffer;
if (globalThis && !globalThis.Buffer) {
    globalThis.Buffer = Buffer;
}

import { ExtensionTransport, injectBridgeCode } from '@ton/walletkit/bridge';
import type { Browser } from 'webextension-polyfill';

import { getTonConnectDeviceInfo, getTonConnectWalletManifest } from '../utils/walletManifest';

declare const browser: Browser;

function injectTonConnectBridge() {
    // eslint-disable-next-line no-undef
    const browserObj = typeof browser !== 'undefined' ? browser : (chrome as unknown as Browser);
    try {
        // Inject the simplified bridge that forwards to extension
        injectBridgeCode(
            window,
            {
                deviceInfo: getTonConnectDeviceInfo(),
                walletInfo: getTonConnectWalletManifest(),
            },

            new ExtensionTransport(window, 'tonkeeper-tonconnect', browserObj),
        );

        // eslint-disable-next-line no-console
        console.log('TonConnect bridge injected - forwarding to extension');
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to inject TonConnect bridge:', error);
    }
}

injectTonConnectBridge();
