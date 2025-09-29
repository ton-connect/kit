# TonConnect JS Bridge Usage Examples

This document demonstrates how to use the TonConnect JS Bridge functionality in the WalletKit.

## Basic Usage

### 1. Initialize WalletKit with JS Bridge

```typescript
import { TonWalletKit } from '@ton/walletkit';

const walletKit = new TonWalletKit({
    bridgeUrl: 'https://bridge.tonapi.io/bridge',
    network: CHAIN.MAINNET,
});

// JS Bridge is automatically initialized and available
```

### 2. Generate Injection Code

```typescript
// Generate injection code for a specific wallet
const injectCode = walletKit.getInjectCode({
    walletName: 'tonkeeper',
    deviceInfo: {
        platform: 'web',
        appName: 'My Wallet',
        appVersion: '1.0.0',
        maxProtocolVersion: 2,
        features: ['SendTransaction', 'SignData'],
    },
});

// In extension content script:
const script = document.createElement('script');
script.textContent = injectCode;
document.head.appendChild(script);
script.remove();

// Now window.tonkeeper.tonconnect is available to dApps
```

### 3. Handle Bridge Requests (Extension Content Script)

```typescript
// Listen for bridge requests from injected code
window.addEventListener('message', async (event) => {
    if (event.source !== window || event.data.source !== 'tonkeeper-tonconnect') {
        return;
    }
    
    if (event.data.type === 'TONCONNECT_BRIDGE_REQUEST') {
        try {
            // Process request through WalletKit
            const result = await walletKit.processBridgeRequest(event.data);
            
            // Send response back to injected bridge
            window.postMessage({
                type: 'TONCONNECT_BRIDGE_RESPONSE',
                source: 'tonkeeper-tonconnect',
                messageId: event.data.messageId,
                success: true,
                result,
            }, '*');
        } catch (error) {
            // Send error response
            window.postMessage({
                type: 'TONCONNECT_BRIDGE_RESPONSE',
                source: 'tonkeeper-tonconnect',
                messageId: event.data.messageId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, '*');
        }
    }
});
```

## Advanced Usage

### 1. Custom JS Bridge Manager

```typescript
import { JSBridgeManager } from '@ton/walletkit';

const jsBridgeManager = walletKit.getJSBridgeManager();

if (jsBridgeManager) {
    // Update configuration
    jsBridgeManager.updateConfiguration({
        defaultWalletName: 'myWallet',
        deviceInfo: {
            appName: 'Custom Wallet App',
            appVersion: '2.0.0',
        },
    });
    
    // Create a pre-configured injector
    const injector = jsBridgeManager.createInjector('myWallet');
    const code = injector();
}
```

### 2. Wallet Name Validation

```typescript
import { validateWalletName, isValidWalletName } from '@ton/walletkit';

// Validate wallet name before injection
try {
    validateWalletName('tonkeeper'); // ✅ Valid
    validateWalletName('eval'); // ❌ Throws error - reserved word
} catch (error) {
    console.error('Invalid wallet name:', error.message);
}

// Or use non-throwing version
if (isValidWalletName('tonkeeper')) {
    const injectCode = walletKit.getInjectCode({ walletName: 'tonkeeper' });
}
```

### 3. dApp Integration (How dApps Use the Bridge)

```javascript
// dApp side - using the injected bridge
if (window.tonkeeper && window.tonkeeper.tonconnect) {
    const bridge = window.tonkeeper.tonconnect;
    
    // Connect to wallet
    try {
        const connectResult = await bridge.connect(2, {
            manifestUrl: 'https://mydapp.com/tonconnect-manifest.json',
            items: [
                { name: 'ton_addr' },
                { name: 'ton_proof', payload: 'my-proof-payload' }
            ]
        });
        
        console.log('Connected:', connectResult);
        
        // Send transaction
        const txResult = await bridge.send({
            method: 'sendTransaction',
            params: [{
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [{
                    address: 'EQD...',
                    amount: '1000000000', // 1 TON in nanotons
                    payload: ''
                }]
            }],
            id: Date.now().toString()
        });
        
        console.log('Transaction sent:', txResult);
        
    } catch (error) {
        console.error('Bridge error:', error);
    }
}
```

## Safety Features

### 1. Collision Detection

The bridge automatically checks if `window[walletName].tonconnect` already exists and skips injection if found:

```javascript
// In injected code
if (window.tonkeeper && window.tonkeeper.tonconnect) {
    console.log('tonkeeper.tonconnect already exists, skipping injection');
    return;
}
```

### 2. Wallet Name Validation

Comprehensive validation prevents dangerous wallet names:

- Must be valid JavaScript identifier
- Cannot be reserved words (eval, function, etc.)
- Cannot contain dangerous patterns
- Length limits (2-50 characters)
- No double underscore prefix

### 3. Secure Message Protocol

All communication uses structured message protocol with:
- Message type validation
- Source verification
- Timeout handling
- Error boundaries

## Error Handling

### Common Errors and Solutions

1. **"Wallet name is a reserved word"**
   ```typescript
   // ❌ Bad
   walletKit.getInjectCode({ walletName: 'eval' });
   
   // ✅ Good
   walletKit.getInjectCode({ walletName: 'myWallet' });
   ```

2. **"JS Bridge Manager is not available"**
   ```typescript
   // Check if JS Bridge is available
   const jsBridge = walletKit.getJSBridgeManager();
   if (jsBridge && jsBridge.isAvailable()) {
       // Safe to use
   }
   ```

3. **"Connection timeout"**
   ```javascript
   // Bridge has built-in timeouts:
   // - Connect: 30 seconds
   // - Restore: 10 seconds  
   // - Send: 60 seconds
   ```

## Browser Extension Manifest

For browser extensions, ensure proper permissions:

```json
{
  "manifest_version": 3,
  "permissions": ["activeTab"],
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "run_at": "document_start"
  }]
}
```
