// Background script for TON Wallet Demo extension
/* eslint-disable no-console, no-undef */
console.log('TON Wallet Demo extension background script loaded');

import { TonWalletKit, JSBridgeManager } from '@ton/walletkit';
import type { BridgeRequest } from '@ton/walletkit';

// Initialize WalletKit and JSBridge
let walletKit: TonWalletKit | null = null;
let jsBridgeManager: JSBridgeManager | null = null;

async function initializeWalletKit() {
    try {
        // Initialize WalletKit with JS Bridge support
        walletKit = new TonWalletKit({
            bridgeUrl: 'https://bridge.tonapi.io/bridge',
            apiUrl: 'https://tonapi.io',
            config: {
                jsBridgeOptions: {
                    enabled: true,
                    defaultWalletName: 'tonkeeper',
                },
            },
        });

        // Wait for WalletKit to be ready
        await walletKit.waitForReady();
        jsBridgeManager = walletKit.getJSBridgeManager() || null;

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

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

    // Handle different message types
    switch (message.type) {
        case 'TONCONNECT_BRIDGE_REQUEST':
            // Handle TonConnect bridge requests through WalletKit
            handleBridgeRequest(message.payload, sender, sendResponse);
            return true; // Keep message channel open for async response
        case 'WALLET_REQUEST':
            // Forward wallet requests to popup or handle them
            handleWalletRequest(message.payload);
            break;
        case 'GET_WALLET_STATE':
            // Get current wallet state
            handleGetWalletState(sendResponse);
            return true; // Keep message channel open for async response
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
        if (!jsBridgeManager) {
            throw new Error('JS Bridge Manager not initialized');
        }

        console.log('Processing bridge request through WalletKit:', bridgeRequest.method);

        // Process the request through WalletKit's JS Bridge Manager
        const result = await jsBridgeManager.processBridgeRequest(bridgeRequest);

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
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['src/extension/content.js'],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            world: 'MAIN' as any, // needed to access window
        });
    } catch (error) {
        console.error('Error injecting script:', error);
    }
}

// Send bridge events to content scripts when needed
// function sendBridgeEventToTab(tabId: number, source: string, event: unknown) {
//     chrome.tabs.sendMessage(tabId, {
//         type: 'TONCONNECT_BRIDGE_EVENT',
//         source,
//         event,
//     });
// }

// Export for module compatibility
export {};
