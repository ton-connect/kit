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

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        allowedHosts: ['localhost', '127.0.0.1', 'local.dev'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            react: path.resolve(__dirname, '../../node_modules/react'),
            // Pin react-dom to this app to avoid picking a different hoisted version in CI
            'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
            'react-dom/client': path.resolve(__dirname, './node_modules/react-dom/client'),
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom'],
        force: true,
    },
});
