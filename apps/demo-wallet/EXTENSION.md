# Browser Extension Build

This document explains how to build and load the TON Wallet Demo as a Chrome browser extension.

## Building the Extension

To build the demo wallet as a browser extension:

```bash
pnpm run build:extension
```

This will:
1. Use the `vite.extension.config.ts` configuration with `vite-plugin-web-extension`
2. Build the extension popup UI from `index.extension.html`
3. Compile the background service worker (`src/extension/background.ts`)
4. Compile the content script (`src/extension/content.ts`)
5. Generate and copy `manifest.json` to the output directory
6. Create a `dist-extension` folder with all necessary files

## Loading in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `dist-extension` folder from this project
5. The extension will be loaded and available in your browser toolbar

## Extension Structure

The extension consists of:

- **Popup** (`index.extension.html`): The main wallet interface shown when clicking the extension icon
- **Background Service Worker** (`src/extension/background.ts`): Manifest V3 service worker handling extension lifecycle and message passing
- **Content Script** (`src/extension/content.ts`): Injects TonConnect bridge into web pages using `@ton/walletkit/bridge`
- **Manifest** (`public/manifest.json`): Manifest V3 configuration defining permissions and structure

## TonConnect Integration

When loaded as an extension, the content script injects the TonConnect bridge into all web pages, allowing dApps to connect to the wallet using the standard TonConnect protocol.

### How It Works

1. The content script (`content.ts`) runs on all web pages
2. It calls `injectBridgeCode()` from `@ton/walletkit/bridge` to inject the TonConnect bridge
3. dApps can then use the standard TonConnect SDK to interact with the wallet
4. Messages are passed between the page and the extension via the bridge

### For dApp Developers

Use the standard TonConnect SDK to connect to this wallet:

```javascript
import TonConnect from '@tonconnect/sdk';

const tonConnect = new TonConnect();
await tonConnect.connectWallet();
```

The wallet will appear as an available option when TonConnect detects the injected bridge.

## Development

For development:

1. **Build the extension**: `pnpm run build:extension`
2. **Load it in Chrome** as described above
3. **Make changes** to the source code
4. **Rebuild**: `pnpm run build:extension`
5. **Reload the extension** in Chrome:
   - Go to `chrome://extensions/`
   - Click the reload icon on the extension card
   - Or use the keyboard shortcut: `Ctrl+R` while on the extensions page

For continuous development, you can use the watch mode:

```bash
pnpm run dev:extension
```

This will rebuild the extension automatically when you make changes. You'll still need to manually reload the extension in Chrome to see the updates. But you need to cautios, because not all changes will be auto reloaded, you still sometimes need to manually restart build.
