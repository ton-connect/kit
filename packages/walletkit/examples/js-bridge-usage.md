# TonConnect JS Bridge for Browser Extensions

This guide shows how to build a browser extension wallet using WalletKit's JS Bridge functionality. The JS Bridge allows your extension to provide a `window.ton.tonconnect` API that dApps can use to connect and interact with your wallet.

**Live Example**: See the [demo-wallet extension](../../../apps/demo-wallet/) for a complete working implementation.

## Architecture Overview

The JS Bridge uses a three-layer architecture to securely connect dApps with your wallet extension:

```
┌────────────────────────────────────────────────────────────┐
│  Web Page (dApp)                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  window.ton.tonconnect                               │  │
│  │  - connect()                                         │  │
│  │  - send()                                            │  │
│  │  - restoreConnection()                               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                         ↕ chrome.runtime.sendMessage
┌────────────────────────────────────────────────────────────┐
│  Extension Background Script                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TonWalletKit                                        │  │
│  │  - processInjectedBridgeRequest()                    │  │
│  │  - onConnectRequest()                                │  │
│  │  - onTransactionRequest()                            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Flow:**
1. **Injected Code** runs in the page context and provides the `window.ton.tonconnect` API to dApps
2. **Background Script** receives requests via `chrome.runtime.onMessageExternal` and processes them through WalletKit
3. **Responses** are sent back through the same message channel

## Step 1: Extension Manifest Setup

Create a `manifest.json` with the required permissions:

```json
{
  "manifest_version": 3,
  "name": "My TON Wallet",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "tabs"
  ],
  "externally_connectable": {
    "matches": ["<all_urls>"]
  },
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "web_accessible_resources": [
    {
      "resources": ["content.js"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

**Key permissions:**
- `storage` - Store wallet data and sessions
- `scripting` - Inject content scripts dynamically
- `tabs` - Monitor page loads for injection
- `externally_connectable` - Allow web pages to send messages to your extension

## Step 2: Background Script - Initialize WalletKit

Create `background.js` to handle the wallet logic:

```typescript
import { ExtensionStorageAdapter, TonWalletKit } from '@ton/walletkit';
import type { 
    InjectedToExtensionBridgeRequest, 
    InjectedToExtensionBridgeRequestPayload 
} from '@ton/walletkit';

let walletKit: TonWalletKit | null = null;

// Initialize WalletKit with extension storage
async function initializeWalletKit() {
    try {
        walletKit = new TonWalletKit({
            deviceInfo: {
                platform: 'browser',
                appName: 'My TON Wallet',
                appVersion: '1.0.0',
                maxProtocolVersion: 2,
                features: [
                    'SendTransaction',
                    { name: 'SendTransaction', maxMessages: 4 },
                    { name: 'SignData', types: ['text', 'binary', 'cell'] }
                ]
            },
            walletManifest: {
                name: 'mywallet',
                appName: 'My TON Wallet',
                aboutUrl: 'https://example.com/about',
                imageUrl: 'https://example.com/icon.png',
                platforms: ['chrome', 'firefox'],
                jsBridgeKey: 'mywallet',  // window.mywallet.tonconnect
                injected: true,
                embedded: false,
                bridgeUrl: 'https://connect.ton.org/bridge',
                features: [
                    'SendTransaction',
                    { name: 'SendTransaction', maxMessages: 4 }
                ]
            },
            storage: new ExtensionStorageAdapter({}, chrome.storage.local)
        });

        await walletKit.waitForReady();
        console.log('WalletKit initialized');
    } catch (error) {
        console.error('Failed to initialize WalletKit:', error);
    }
}

// Initialize on extension install/startup
chrome.runtime.onInstalled.addListener(() => {
    initializeWalletKit();
});
initializeWalletKit();
```

## Step 3: Background Script - Handle Bridge Requests

Listen for requests from the injected bridge and process them through WalletKit:

```typescript
// Type guard for bridge requests
function isBridgeRequest(message: unknown): asserts message is InjectedToExtensionBridgeRequest {
    if (
        typeof message !== 'object' ||
        message === null ||
        !('type' in message) ||
        message.type !== TONCONNECT_BRIDGE_REQUEST
    ) {
        throw new Error('Invalid bridge request');
    }
}

// Listen for messages from injected bridge
chrome.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {
    if (message.type !== TONCONNECT_BRIDGE_REQUEST) {
        return;
    }

    isBridgeRequest(message);
    
    try {
        // Extract request metadata
        const messageInfo = {
            messageId: message.messageId,
            tabId: sender.tab?.id?.toString(),
            domain: sender.tab?.url ? new URL(sender.tab.url).host : undefined
        };

        // Process through WalletKit
        const result = await walletKit?.processInjectedBridgeRequest(
            messageInfo,
            message.payload
        );

        sendResponse({ success: true, result });
    } catch (error) {
        console.error('Bridge request failed:', error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
```



## Step 4: Content Script - Inject the Bridge

Create `content.js` to inject the bridge into web pages:

```typescript
import { Buffer } from 'buffer';
import { injectBridgeCode } from '@ton/walletkit/bridge';

// Polyfill Buffer for web context
window.Buffer = Buffer;
if (globalThis && !globalThis.Buffer) {
    globalThis.Buffer = Buffer;
}

// Inject the TonConnect bridge
function injectTonConnectBridge() {
    try {
        injectBridgeCode(window, {
            deviceInfo: {
                platform: 'browser',
                appName: 'My TON Wallet',
                appVersion: '1.0.0',
                maxProtocolVersion: 2,
                features: ['SendTransaction', 'SignData']
            },
            walletInfo: {
                name: 'mywallet',
                appName: 'My TON Wallet',
                jsBridgeKey: 'mywallet',
                injected: true,
                embedded: false
            }
        });

        console.log('TonConnect bridge injected - window.ton.tonconnect is available');
    } catch (error) {
        console.error('Failed to inject TonConnect bridge:', error);
    }
}

injectTonConnectBridge();
```

## Step 5: Dynamic Content Script Injection

Instead of declaring content scripts in the manifest, inject them dynamically when pages load:

```typescript
// In background.js

// Inject content script into all pages on load
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url) {
        await injectContentScript(tabId);
    }
});

async function injectContentScript(tabId: number) {
    try {
        const tab = await chrome.tabs.get(tabId);
        
        // Skip restricted pages
        if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
            return;
        }

        // Inject content script into main world (page context)
        await chrome.scripting.executeScript({
            target: { tabId, allFrames: true },
            files: ['content.js'],
            world: 'MAIN' as any  // Access to window object
        });
    } catch (error) {
        console.error('Error injecting script:', error);
    }
}
```

## How dApps Use Your Wallet

Once injected, dApps can detect and use your wallet:

```javascript
// dApp code - check if wallet is available
if (window.ton && window.ton.tonconnect) {
    const bridge = window.ton.tonconnect;
    
    // Connect to wallet
    const result = await bridge.connect(2, {
        manifestUrl: 'https://mydapp.com/tonconnect-manifest.json',
        items: [
            { name: 'ton_addr' },
            { name: 'ton_proof', payload: 'proof-payload' }
        ]
    });
    
    console.log('Connected:', result);
    
    // Send transaction
    const txResult = await bridge.send({
        method: 'sendTransaction',
        params: [{
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [{
                address: 'EQD...',
                amount: '1000000000',  // 1 TON
                payload: ''
            }]
        }],
        id: '1'
    });
    
    // Listen for events
    bridge.listen((event) => {
        console.log('Wallet event:', event);
    });
}
```

## Safety Features

### 1. Collision Detection

The bridge automatically checks if `window.ton.tonconnect` already exists and skips injection:

```typescript
if (window.ton && window.ton.tonconnect) {
    console.log('ton.tonconnect already exists, skipping injection');
    return;
}
```

### 2. Secure Message Protocol

All communication uses Chrome's message passing with:
- Message type validation
- Source verification (sender.tab)
- Request/response matching via messageId
- Built-in timeouts (30s for connect, 10s for restore, 60s for send)

## Troubleshooting

### Content script not injecting

**Problem:** Bridge not available on some pages.

**Solution:** 
1. Check `host_permissions` in manifest includes `<all_urls>`
2. Verify `externally_connectable` is configured
3. Make sure `world: 'MAIN'` is set for script injection
4. Check browser console for injection errors

### chrome:// pages restriction

**Problem:** Can't inject into chrome:// or extension pages.

**Solution:** Filter these out before injection:

```typescript
if (tab.url?.startsWith('chrome://') || 
    tab.url?.startsWith('chrome-extension://')) {
    return;  // Skip injection
}
```

### Message not reaching background script

**Problem:** `chrome.runtime.sendMessage` fails silently.

**Solution:**
1. Ensure `externally_connectable.matches` includes the page's URL
2. Check that background script is running (service worker may sleep)
3. Verify `chrome.runtime.onMessageExternal` listener is registered

### Request timeouts

**Problem:** Requests timeout before user responds.

**Built-in timeouts:**
- Connect: 30 seconds
- Restore connection: 10 seconds
- Send transaction: 60 seconds

These are handled automatically by the injected bridge, but consider showing UI to users before timeout expires.

## Advanced: Customizing Device & Wallet Info

You can customize how your wallet appears to dApps:

```typescript
// Custom device info
const deviceInfo = {
    platform: 'browser',
    appName: 'My Custom Wallet',
    appVersion: '2.0.0',
    maxProtocolVersion: 2,
    features: [
        'SendTransaction',
        {
            name: 'SendTransaction',
            maxMessages: 4  // Support up to 4 messages per transaction
        },
        {
            name: 'SignData',
            types: ['text', 'binary', 'cell']  // Supported data types
        }
    ]
};

// Custom wallet manifest
const walletInfo = {
    name: 'mycustomwallet',  // Unique identifier
    appName: 'My Custom Wallet',
    aboutUrl: 'https://mycustomwallet.com',
    imageUrl: 'https://mycustomwallet.com/icon.png',
    platforms: ['chrome', 'firefox', 'safari'],
    jsBridgeKey: 'mycustomwallet',  // window.mycustomwallet.tonconnect
    injected: true,
    embedded: false,
    tondns: 'mycustomwallet.ton',
    bridgeUrl: 'https://bridge.tonapi.io/bridge',
    universalLink: 'https://mycustomwallet.com/ton-connect',
    features: [/* same as deviceInfo.features */]
};
```

## Complete Example

See the full working implementation in the [demo-wallet](../../../apps/demo-wallet/src/extension/) directory:

- [`background_main.ts`](../../../apps/demo-wallet/src/extension/background_main.ts) - Background script with WalletKit integration
- [`content.ts`](../../../apps/demo-wallet/src/extension/content.ts) - Content script injection
- [`manifest.json`](../../../apps/demo-wallet/public/manifest.json) - Extension manifest

## Resources

- [TonConnect Documentation](https://docs.ton.org/develop/dapps/ton-connect)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [WalletKit Main Documentation](../DOCUMENTATION.md)
