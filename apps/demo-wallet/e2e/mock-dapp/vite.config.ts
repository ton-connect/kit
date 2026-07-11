/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'vite';

// Vite config for the QA Mock dApp test fixture. `root` is this directory so vite serves
// index.html + bundles main.ts on the fly. `@tonconnect/sdk` is a direct devDependency of
// demo-wallet (catalog:), so a bare `import '@tonconnect/sdk'` resolves normally from this
// app's own module graph — no cross-app alias needed.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: __dirname,
    server: {
        // `127.0.0.1` (not `localhost`): WalletKit's manifest `isValidHost` guard rejects
        // dot-less hosts before fetching (see main.ts / packages/walletkit/src/utils/url.ts).
        host: '127.0.0.1',
        port: 5175,
        strictPort: true,
    },
});
