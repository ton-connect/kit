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

import { ExtensionStorageAdapter, TonWalletKit } from '@ton/walletkit';
import type { InjectedToExtensionBridgeRequest, InjectedToExtensionBridgeRequestPayload } from '@ton/walletkit';
import browser from 'webextension-polyfill';
import type { Browser, Runtime } from 'webextension-polyfill';

import { getTonConnectDeviceInfo, getTonConnectWalletManifest } from '../utils/walletManifest';

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
                jsBridgeTransport: async (sessionId: string, message: unknown) => {
                    await browser.tabs.sendMessage(parseInt(sessionId), message);
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

function isBridgeRequest(message: unknown): asserts message is InjectedToExtensionBridgeRequest {
    if (
        typeof message !== 'object' ||
        message === null ||
        !('type' in message) ||
        message.type !== 'TONCONNECT_BRIDGE_REQUEST'
    ) {
        throw new Error('Invalid bridge request');
    }
}

browser.runtime.onMessageExternal.addListener((async (message, sender, sendResponse) => {
    if (typeof message !== 'object' || message === null || !('type' in message)) {
        return false;
    }
    switch (message.type) {
        case 'TONCONNECT_BRIDGE_REQUEST':
            isBridgeRequest(message);
            // Handle TonConnect bridge requests through WalletKit
            handleBridgeRequest(message.messageId, message.payload, sender, sendResponse);
            if (message.payload.method === 'connect' || message.payload.method === 'send') {
                const views = await browser.runtime.getContexts({
                    contextTypes: ['POPUP'],
                });

                // popup is open, ignore event
                if (views.length > 0) {
                    // do nothing
                } else {
                    await browser.action.openPopup().catch((e) => {
                        // eslint-disable-next-line no-console
                        console.error('popup not opened', e);
                    });
                }
            }
            break;
        case 'INJECT_CONTENT_SCRIPT':
            if (!sender.tab?.id) {
                return;
            }
            injectContentScript(sender.tab.id);
            break;
        default:
        // do nothing
    }
    return;
}) as Runtime.OnMessageListener);

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url) {
        await injectContentScript(tabId);
    }
});

async function handleBridgeRequest(
    messageId: string,
    bridgeRequest: InjectedToExtensionBridgeRequestPayload,
    _sender: browser.Runtime.MessageSender,
    sendResponse: (response: { success: boolean; result?: unknown; error?: unknown }) => void,
) {
    try {
        const getHostFromUrl = (url: string | undefined) => {
            if (!url) {
                return undefined;
            }
            try {
                const urlObj = new URL(url);
                return urlObj.host;
            } catch {
                return undefined;
            }
        };
        // Process the request through WalletKit's JS Bridge Manager
        const result = await walletKit?.processInjectedBridgeRequest(
            {
                messageId,
                tabId: _sender.tab?.id?.toString(),
                domain: getHostFromUrl(_sender.tab?.url),
            },
            {
                ...bridgeRequest,
            },
        );

        sendResponse({ success: true, result });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Bridge request failed:', error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

// Function to inject content script
async function injectContentScript(tabId: number) {
    try {
        const tab = (await browser.tabs.get(tabId)) || '';
        // Skip chrome:// pages
        if (tab.url?.startsWith('chrome://')) {
            return;
        }
        await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            files: ['src/extension/content.js'],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            world: 'MAIN' as any, // needed to access window
        });
        await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [browser.runtime.id],
            func: (extensionId) => {
                window.postMessage(
                    {
                        type: 'INJECT_EXTENSION_ID',
                        extensionId,
                    },
                    '*',
                );

                // eslint-disable-next-line no-undef
                const browserObj = typeof browser !== 'undefined' ? browser : (chrome as unknown as Browser);
                browserObj.runtime.onMessage.addListener(((message, _sender, _sendResponse) => {
                    if (typeof message !== 'object') {
                        return;
                    }
                    window.postMessage({
                        ...message,
                        sender: _sender,
                    });
                }) as Runtime.OnMessageListener);
            },
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error injecting script:', error);
    }
}

// Export for module compatibility
export {};
