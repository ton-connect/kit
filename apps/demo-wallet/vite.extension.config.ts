/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'node:path';

import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import webExtension, { readJsonFile } from '@truecarry/vite-plugin-web-extension';
// import { analyzer } from 'vite-bundle-analyzer';

function generateManifest() {
    const manifest = readJsonFile('manifest.json');
    const pkg = readJsonFile('package.json');
    return {
        name: pkg.name,
        description: pkg.description,
        version: pkg.version,
        ...manifest,
    };
}

const browser = process.env.TARGET || 'chrome';
const outDir = `dist-extension-${browser}`;

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        webExtension({
            disableAutoLaunch: true,
            manifest: generateManifest,
            additionalInputs: [
                'src/extension/content.ts', // window script
                'src/extension/content_script.ts',
            ],
            browser: process.env.TARGET || 'chrome',
            htmlViteConfig: {
                build: {
                    outDir,
                    rollupOptions: {
                        output: {
                            inlineDynamicImports: true,
                        },
                    },
                },
            },
            scriptViteConfig: {
                plugins: [
                    // analyzer()
                ],
                build: {
                    outDir,
                    minify: false,
                },
            },
            manifestViteConfig: {
                build: {
                    outDir,
                },
            },
        }),
    ],
    resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
