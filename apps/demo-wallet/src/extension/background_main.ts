// Background script for TON Wallet Demo extension
/* eslint-disable no-console, no-undef */
console.log('TON Wallet Demo extension background script loaded');

import { ExtensionStorageAdapter, TonWalletKit } from '@ton/walletkit';
import type { BridgeRequest } from '@ton/walletkit';

// Initialize WalletKit and JSBridge
let walletKit: TonWalletKit | null = null;

async function initializeWalletKit() {
    try {
        // Initialize WalletKit with JS Bridge support
        walletKit = new TonWalletKit({
            apiUrl: 'https://tonapi.io',
            config: {
                bridge: {
                    enableJsBridge: true,
                    bridgeUrl: 'https://bridge.tonapi.io/bridge',
                    bridgeName: 'tonkeeper',
                },
                eventProcessor: {
                    disableEvents: true,
                },
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            storage: new ExtensionStorageAdapter({}, chrome.storage.local as any),
        });

        // Wait for WalletKit to be ready
        await walletKit.waitForReady();

        console.log('WalletKit initialized with JS Bridge support');
    } catch (error) {
        console.error('Failed to initialize WalletKit:', error);
    }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('TON Wallet Demo extension installed');
    initializeWalletKit();
});

// Initialize on startup
initializeWalletKit();

chrome.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {
    console.log('Background received message external:', message, sender, sendResponse);

    switch (message.type) {
        case 'TONCONNECT_BRIDGE_REQUEST':
            // Handle TonConnect bridge requests through WalletKit
            handleBridgeRequest(message.payload, sender, sendResponse);
            if (message.payload.method === 'connect' || message.payload.method === 'send') {
                await chrome.action.openPopup().catch((e) => {
                    console.log('popup not opened', e);
                });
            }
            break;
        case 'WALLET_REQUEST':
            // Forward wallet requests to popup or handle them
            handleWalletRequest(message.payload);
            break;
        case 'GET_WALLET_STATE':
            // Get current wallet state
            handleGetWalletState(sendResponse);
            break;
        case 'INJECT_CONTENT_SCRIPT':
            console.log('INJECT_CONTENT_SCRIPT', sender);
            if (!sender.tab?.id) {
                return;
            }
            injectContentScript(sender.tab.id);
            break;
        default:
            console.log('Unknown message type:', message.type);
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log('tabs.onUpdated', tabId, changeInfo, tab);
    if (changeInfo.status === 'loading' && tab.url) {
        await injectContentScript(tabId);
    }
});

async function handleBridgeRequest(
    bridgeRequest: BridgeRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean; result?: unknown; error?: unknown }) => void,
) {
    try {
        console.log('Processing bridge request through WalletKit:', bridgeRequest);

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
        const result = await walletKit?.processInjectedBridgeRequest({
            ...bridgeRequest,
            tabId: _sender.tab?.id?.toString(),
            domain: getHostFromUrl(_sender.tab?.url),
        });

        sendResponse({ success: true, result });
    } catch (error) {
        console.error('Bridge request failed:', error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleWalletRequest(payload: unknown) {
    try {
        // Store the request for the popup to handle
        await chrome.storage.local.set({
            pendingRequest: {
                ...(payload as Record<string, unknown>),
                timestamp: Date.now(),
            },
        });

        // Open popup or notify user
        console.log('Wallet request stored:', payload);
    } catch (error) {
        console.error('Error handling wallet request:', error);
    }
}

async function handleGetWalletState(sendResponse: (response: unknown) => void) {
    try {
        const result = await chrome.storage.local.get(['walletState']);
        sendResponse({ success: true, data: result.walletState });
    } catch (error) {
        console.error('Error getting wallet state:', error);
        sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
}

// Function to inject content script
async function injectContentScript(tabId: number) {
    try {
        const tab = (await chrome.tabs.get(tabId)) || '';
        // Skip chrome:// pages
        if (tab.url?.startsWith('chrome://')) {
            return;
        }
        await chrome.scripting.executeScript({
            target: { tabId, allFrames: true },
            files: ['src/extension/content.js'],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            world: 'MAIN' as any, // needed to access window
        });
        await chrome.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [chrome.runtime.id],
            func: (extensionId) => {
                window.postMessage(
                    {
                        type: 'INJECT_EXTENSION_ID',
                        extensionId,
                    },
                    '*',
                );
                chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
                    window.postMessage({
                        ...message,
                        sender: _sender,
                    });
                });
            },
        });
    } catch (error) {
        console.error('Error injecting script:', error);
    }
}

// Export for module compatibility
export {};
