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

import { ExtensionTransport, injectBridgeCode, type MessageSender, type MessageListener } from '@ton/walletkit/bridge';
import { sendMessage, onMessage, setNamespace } from 'webext-bridge/window';

import { getTonConnectDeviceInfo, getTonConnectWalletManifest } from '../utils/walletManifest';

import { JS_BRIDGE_MESSAGE_TO_BACKGROUND, JS_BRIDGE_MESSAGE_TO_CONTENT, JS_BRIDGE_NAMESPACE } from '@/lib/constants';

setNamespace(JS_BRIDGE_NAMESPACE);

function injectTonConnectBridge() {
    try {
        // Create webext-bridge adapters
        const messageSender: MessageSender = async (data: unknown) => {
            return await sendMessage(JS_BRIDGE_MESSAGE_TO_BACKGROUND, JSON.parse(JSON.stringify(data)), 'background');
        };

        const messageListener: MessageListener = (callback: (data: unknown) => void) => {
            onMessage(JS_BRIDGE_MESSAGE_TO_CONTENT, callback);
        };

        // Inject the simplified bridge that forwards to extension
        injectBridgeCode(
            window,
            {
                deviceInfo: getTonConnectDeviceInfo(),
                walletInfo: getTonConnectWalletManifest(),
            },
            new ExtensionTransport(messageSender, messageListener),
        );

        // eslint-disable-next-line no-console
        console.log('TonConnect bridge injected - forwarding to extension');
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to inject TonConnect bridge:', error);
    }
}

injectTonConnectBridge();
