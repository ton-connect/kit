/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Background script for TON Wallet Demo extension

// eslint-disable-next-line no-console
console.log('TON Wallet Demo extension background script loaded');

import { Network, ExtensionStorageAdapter, TonWalletKit } from '@ton/walletkit';
import type { InjectedToExtensionBridgeRequestPayload } from '@ton/walletkit';
import browser from 'webextension-polyfill';
import { onMessage } from '@truecarry/webext-bridge/background';
import { INJECT_CONTENT_SCRIPT, TONCONNECT_BRIDGE_REQUEST } from '@ton/walletkit/bridge';

import { getTonConnectDeviceInfo, getTonConnectWalletManifest } from '../utils/walletManifest';

import { JS_BRIDGE_MESSAGE_TO_BACKGROUND } from '@/lib/constants';
import { SendMessageToExtensionContentFromBackground } from '@/lib/extensionBackground';
import { DISABLE_AUTO_POPUP, ENV_TON_API_KEY_MAINNET, ENV_TON_API_KEY_TESTNET } from '@/lib/env';

// Initialize WalletKit and JSBridge
let walletKit: TonWalletKit | null = null;

async function initializeWalletKit() {
    try {
        // Initialize WalletKit with JS Bridge support
        walletKit = new TonWalletKit({
            deviceInfo: getTonConnectDeviceInfo(),
            walletManifest: getTonConnectWalletManifest(),
            eventProcessor: {
                disableEvents: true,
            },

            storage: new ExtensionStorageAdapter({}, browser.storage.local),
            bridge: {
                jsBridgeTransport: SendMessageToExtensionContentFromBackground,
            },
            networks: {
                [Network.mainnet().chainId]: {
                    apiClient: {
                        url: 'https:/toncenter.com',
                        key: ENV_TON_API_KEY_MAINNET,
                    },
                },
                [Network.testnet().chainId]: {
                    apiClient: {
                        url: 'https://testnet.toncenter.com',
                        key: ENV_TON_API_KEY_TESTNET,
                    },
                },
            },
        });

        // Wait for WalletKit to be ready
        await walletKit.waitForReady();
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize WalletKit:', error);
    }
}

// Handle extension installation
browser.runtime.onInstalled.addListener(() => {
    initializeWalletKit();
});

// Initialize on startup
initializeWalletKit();

onMessage(JS_BRIDGE_MESSAGE_TO_BACKGROUND, async (e) => {
    if (!e || typeof e !== 'object' || !('data' in e)) {
        return;
    }
    const { type } = e.data as unknown as {
        type: string;
        payload: unknown;
    };

    if (type === TONCONNECT_BRIDGE_REQUEST) {
        const { payload, messageId } = e.data as unknown as {
            payload: InjectedToExtensionBridgeRequestPayload;
            messageId: string;
        };

        try {
            await handleBridgeRequest(messageId, payload, e.sender.tabId);

            if (!DISABLE_AUTO_POPUP) {
                if (payload.method === 'connect' || payload.method === 'send') {
                    if (payload.params && Array.isArray(payload.params)) {
                        const item = payload.params[0];
                        if (item && typeof item === 'object' && 'method' in item) {
                            if (item.method === 'disconnect') {
                                return;
                            }
                        }
                    }
                    const views = await browser.runtime.getContexts({
                        contextTypes: ['POPUP'],
                    });

                    // popup is open, ignore event
                    if (views.length === 0) {
                        await browser.action.openPopup().catch((e) => {
                            // eslint-disable-next-line no-console
                            console.error('popup not opened', e);
                        });
                    }
                }
            }

            return;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Bridge request failed:', error);

            return;
        }
    } else if (type === INJECT_CONTENT_SCRIPT) {
        const sender = e.sender;
        const tabId = sender.tabId;
        if (tabId) {
            await injectContentScript(tabId);
        }
    }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url) {
        await injectContentScript(tabId);
    }
});

async function handleBridgeRequest(
    messageId: string,
    bridgeRequest: InjectedToExtensionBridgeRequestPayload,
    tabId: number | undefined,
) {
    const getHostFromUrl = async (tabId: number | undefined) => {
        if (!tabId) {
            return undefined;
        }
        try {
            const tab = await browser.tabs.get(tabId);
            if (tab.url) {
                const urlObj = new URL(tab.url);
                return `${urlObj.protocol}//${urlObj.host}`;
            }
        } catch {
            return undefined;
        }
        return undefined;
    };

    // Process the request through WalletKit's JS Bridge Manager
    const result = await walletKit?.processInjectedBridgeRequest(
        {
            messageId,
            tabId: tabId?.toString(),
            domain: await getHostFromUrl(tabId),
        },
        {
            ...bridgeRequest,
        },
    );

    return result;
}

// Function to inject content script
async function injectContentScript(tabId: number) {
    try {
        const tab = (await browser.tabs.get(tabId)) || '';
        // Skip chrome:// pages
        if (tab.url?.startsWith('chrome://')) {
            return;
        }
        // Bridge between background and window
        await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            files: ['src/extension/content_script.js'],
        });
        // Window script
        await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            files: ['src/extension/content.js'],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            world: 'MAIN' as any, // needed to access window
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error injecting script:', error);
    }
}

// Export for module compatibility
export {};
