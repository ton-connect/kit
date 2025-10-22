// Bridge injection for Android internal browser
// This file is the entry point for injecting TonConnect bridge into WebViews
// Implements window reference tracking for iframe support
import { Buffer } from 'buffer';

// Polyfill Buffer for environments that don't have it
if (typeof window !== 'undefined') {
    (window as any).Buffer = Buffer;
}
if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
    (globalThis as any).Buffer = Buffer;
}

import { injectBridgeCode } from '@ton/walletkit/bridge';

// Generate unique frame ID for this window context
// Main frame gets 'main', iframes get unique IDs
const frameId = window === window.top 
    ? 'main' 
    : `frame-${window.location.href}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Store frame ID on window for identification by Android WebView
(window as any).__tonconnect_frameId = frameId;

// Detect if we're in Android WebView
const isAndroidWebView = typeof (window as any).AndroidTonConnect !== 'undefined';

console.log(`[TonConnect] Frame initialized: ${frameId} (isMain: ${window === window.top}, isAndroid: ${isAndroidWebView})`);

function injectTonConnectBridge() {
    try {
        // Log what's already on window
        const existingBridges = {
            'window.ton': typeof (window as any).ton,
            'window.tonkeeper': typeof (window as any).tonkeeper,
            'window.tonwallet': typeof (window as any).tonwallet,
            'window.tonProtocol': typeof (window as any).tonProtocol,
        };
        console.log('[TonConnect] Checking existing bridge objects:', existingBridges);
        
        // Inject the simplified bridge that forwards to Android WebView
        // Use a custom wallet name to avoid conflicts with installed apps
        injectBridgeCode(window, {
            jsBridgeKey: 'wallet',  // Simple name that won't conflict
            deviceInfo: {
                platform: 'android',
                appName: 'Wallet', // Simple name for the UI
                appVersion: '1.0.0',
                maxProtocolVersion: 2,
                features: [
                    'SendTransaction',
                    {
                        name: 'SendTransaction',
                        maxMessages: 4,
                    },
                ] as any
            }
        });

        // Wait a bit for the bridge to be fully initialized
        setTimeout(() => {
            const bridgeInfo = {
                'window.wallet': typeof (window as any).wallet,
                'window.wallet.tonconnect': typeof (window as any).wallet?.tonconnect,
                'isInjected': !!(window as any).wallet?.tonconnect,
            };
            console.log('[TonConnect] Bridge injected for Android internal browser');
            console.log('[TonConnect] Bridge available at:', bridgeInfo);
            
            // If in Android WebView, override message sending to include frameId
            if (isAndroidWebView) {
                console.log('[TonConnect] Android WebView detected, patching bridge...');
                patchBridgeForAndroid();
            } else {
                console.log('[TonConnect] Not in Android WebView, skipping patch');
            }
        }, 100);
    } catch (error) {
        console.error('[TonConnect] Failed to inject bridge:', error);
    }
}

function patchBridgeForAndroid() {
    const bridge = (window as any).wallet?.tonconnect;
    
    if (!bridge) {
        console.warn('[TonConnect] Bridge not found on window.wallet');
        console.log('[TonConnect] Available on window:', Object.keys(window).filter(k => k.includes('ton')));
        return;
    }

    console.log('[TonConnect] ✅ Found bridge, patching for Android...');
    
    // Get frame ID for this window
    const frameId = window === window.parent ? 'main' : `iframe-${Date.now()}`;
    console.log(`[TonConnect] Frame ID: ${frameId}`);
    
    const originalSendToExtension = bridge._sendToExtension;
    
    bridge._sendToExtension = function(message: any) {
        console.log('[TonConnect] 🚀 _sendToExtension called with:', message);
        
        try {
            const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            const method = message?.method || 'unknown';
            const params = message?.params || {};
            
            console.log('[TonConnect] 📤 Preparing request:', { messageId, method, params, frameId });
            
            const request = {
                type: 'TONCONNECT_BRIDGE_REQUEST',  // CRITICAL: Android checks for this type!
                messageId,
                method,
                params,
                frameId  // Include frameId so Android knows which frame to respond to
            };
            
            console.log('[TonConnect] 📨 Calling AndroidTonConnect.postMessage...');
            
            if (typeof (window as any).AndroidTonConnect?.postMessage === 'function') {
                (window as any).AndroidTonConnect.postMessage(JSON.stringify(request));
                console.log('[TonConnect] ✅ Request sent to Android:', messageId);
                
                // Return promise that will be resolved when Android sends back a response
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Request timeout'));
                    }, 30000);
                    
                    (bridge as any)._pendingRequests = (bridge as any)._pendingRequests || {};
                    (bridge as any)._pendingRequests[messageId] = { resolve, reject, timeout };
                });
            } else {
                console.error('[TonConnect] ❌ AndroidTonConnect.postMessage not found');
                throw new Error('AndroidTonConnect bridge not available');
            }
        } catch (error) {
            console.error('[TonConnect] ❌ Error in _sendToExtension:', error);
            throw error;
        }
    };
    
    console.log('[TonConnect] Bridge patched for Android WebView with frame tracking');
    
    // Expose test function for debugging
    (window as any).__testTonConnect = async () => {
        console.log('[TonConnect TEST] Testing bridge connection...');
        try {
            const result = await bridge._sendToExtension({ method: 'connect', params: {} });
            console.log('[TonConnect TEST] Connect result:', result);
            return result;
        } catch (error) {
            console.error('[TonConnect TEST] Connect failed:', error);
            throw error;
        }
    };
    console.log('[TonConnect] Test function available: window.__testTonConnect()');
}

// Listen for responses from Android WebView
window.addEventListener('message', (event: MessageEvent) => {
    // Only process messages from same window (posted by Android via evaluateJavascript)
    if (event.source !== window) return;
    
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    
    // Handle responses meant for this frame
    if (data.type === 'TONCONNECT_BRIDGE_RESPONSE') {
        const bridge = (window as any).wallet?.tonconnect;
        if (bridge && typeof bridge._handleResponse === 'function') {
            console.log(`[TonConnect] Response received in ${frameId}: ${data.messageId}`);
            bridge._handleResponse(data);
        }
    }
    
    // Handle events meant for this frame
    if (data.type === 'TONCONNECT_BRIDGE_EVENT') {
        const bridge = (window as any).wallet?.tonconnect;
        if (bridge && typeof bridge._handleEvent === 'function') {
            console.log(`[TonConnect] Event received in ${frameId}:`, data.event?.type || 'unknown');
            bridge._handleEvent(data.event);
        }
    }
});

injectTonConnectBridge();

console.log(`[TonConnect] Android internal browser bridge ready for frame: ${frameId}`);

// Log what the dApp can see
setTimeout(() => {
    console.log('[TonConnect] 🔍 Wallet detection check:', {
        'window.wallet exists': !!(window as any).wallet,
        'window.wallet.tonconnect exists': !!(window as any).wallet?.tonconnect,
        'tonconnect type': typeof (window as any).wallet?.tonconnect,
        'all ton-related keys': Object.keys(window).filter(k => k.toLowerCase().includes('ton')),
    });
}, 50);

// Announce wallet availability to TonConnect SDK
// This helps the dApp detect our injected wallet
setTimeout(() => {
    const announceEvent = new CustomEvent('tonconnect-wallet-injected', {
        detail: {
            name: 'wallet',
            injected: true,
            jsBridgeKey: 'wallet',
        }
    });
    window.dispatchEvent(announceEvent);
    console.log('[TonConnect] 📢 Wallet announced via tonconnect-wallet-injected event');
    
    // Also expose as window.tonProtocol for compatibility
    if (!(window as any).tonProtocol) {
        (window as any).tonProtocol = {
            tonconnect: (window as any).wallet?.tonconnect
        };
        console.log('[TonConnect] 📢 Also exposed as window.tonProtocol');
    }
}, 100);
