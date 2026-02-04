/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';

import { analyzer } from 'vite-bundle-analyzer';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss(), process.env.ANALYZE === 'true' && analyzer()],
    server: {
        port: 5174,
        allowedHosts: ['localhost', '127.0.0.1', 'local.dev'],
    },
    resolve: {
        alias: {
            '@/components': path.resolve(__dirname, './src/core/components'),
            '@/hooks': path.resolve(__dirname, './src/core/hooks'),
            '@/lib': path.resolve(__dirname, './src/core/lib'),
            '@': path.resolve(__dirname, './src'),
        },
    },
});
