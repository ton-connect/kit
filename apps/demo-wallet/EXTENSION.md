# Browser Extension Build

This document explains how to build and load the TON Wallet Demo as a Chrome browser extension.

## Building the Extension

To build the demo wallet as a browser extension:

```bash
pnpm run build:extension
```

This will:
1. Compile TypeScript files
2. Build the extension using the special Vite configuration
3. Copy the manifest.json to the output directory
4. Create a `dist-extension` folder with all necessary files

## Loading in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `dist-extension` folder from this project
5. The extension will be loaded and available in your browser toolbar

## Extension Structure

The extension consists of:

- **Popup**: The main wallet interface (same as the web app)
- **Background Script**: Handles extension lifecycle and message passing
- **Content Script**: Injects TON wallet provider into web pages
- **Manifest**: Defines extension permissions and structure

## Web Integration

When loaded as an extension, the wallet will inject a `window.tonWallet` object into all web pages, allowing dApps to interact with the wallet.

### Available Methods

```javascript
// Connect to wallet
await window.tonWallet.connect();

// Send transaction
await window.tonWallet.sendTransaction(transaction);

// Sign data
await window.tonWallet.signData(data);

// Disconnect
await window.tonWallet.disconnect();
```

## Development

For development, you can:

1. Build the extension with `npm run build:extension`
2. Load it in Chrome as described above
3. Make changes to the source code
4. Rebuild and reload the extension in Chrome

The extension will use the same wallet functionality as the web version, but packaged for browser extension use.
