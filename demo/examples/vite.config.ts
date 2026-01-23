/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';

import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
            },
        },
    },
    plugins: [
        nodePolyfills({
            // Enable Buffer polyfill
            include: ['buffer'],
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
        }),
    ],
    define: {
        'process.env': {},
    },
    optimizeDeps: {
        include: ['buffer'],
    },
});
