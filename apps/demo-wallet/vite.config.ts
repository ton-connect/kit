/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';

import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import bundleAnalyzer from 'vite-bundle-analyzer';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        process.env.ANALYZE === 'true' ? bundleAnalyzer() : null, // enable analyzer under env
    ],
    server: {
        allowedHosts: ['localhost', '127.0.0.1', 'local.dev'],
    },
    resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
