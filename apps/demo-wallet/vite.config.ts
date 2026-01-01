/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';

import { defineConfig } from 'vite';
import { tamaguiPlugin } from '@tamagui/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    // clearScreen: true,
    plugins: [
        react(),
        tailwindcss(),
        tamaguiPlugin({
            config: '../../demo/ui-kit/src/config/tamagui.config.ts',
            components: ['@tamagui/core'],
            optimize: true,
        }),
    ],
    server: {
        allowedHosts: ['localhost', '127.0.0.1', 'local.dev'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
