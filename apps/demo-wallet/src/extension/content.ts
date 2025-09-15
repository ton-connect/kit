// Content script for TON Wallet Demo extension
/* eslint-disable no-console */
import { Buffer } from 'buffer';

window.Buffer = Buffer;
if (globalThis && !globalThis.Buffer) {
    globalThis.Buffer = Buffer;
}

import { injectBridgeCode } from '@ton/walletkit/bridge';

import { getTonConnectDeviceInfo, getTonConnectWalletManifest } from '../utils/walletManifest';

function injectTonConnectBridge() {
    try {
        // Inject the simplified bridge that forwards to extension
        injectBridgeCode(window, {
            deviceInfo: getTonConnectDeviceInfo(),
            walletInfo: getTonConnectWalletManifest(),
        });

        console.log('TonConnect bridge injected - forwarding to extension');
    } catch (error) {
        console.error('Failed to inject TonConnect bridge:', error);
    }
}

injectTonConnectBridge();
