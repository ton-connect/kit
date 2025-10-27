/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import webExtension, { readJsonFile } from 'vite-plugin-web-extension';
// import { analyzer } from 'vite-bundle-analyzer';

function generateManifest() {
    const manifest = readJsonFile('public/manifest.json');
    const pkg = readJsonFile('package.json');
    return {
        name: pkg.name,
        description: pkg.description,
        version: pkg.version,
        ...manifest,
    };
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        webExtension({
            disableAutoLaunch: true,
            manifest: generateManifest,
            additionalInputs: ['src/extension/content.ts', 'src/extension/inject.ts'],
            browser: process.env.TARGET || 'chrome',
            htmlViteConfig: {
                build: {
                    outDir: 'dist-extension',
                },
            },
            scriptViteConfig: {
                plugins: [
                    // analyzer()
                ],
                build: {
                    outDir: 'dist-extension',
                    minify: false,
                },
            },
        }),
    ],
});
