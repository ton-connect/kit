/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import { fileURLToPath } from 'url';

import type { StorybookConfig } from '@storybook/react-vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(ts|tsx)'],
    addons: [
        // '@storybook/addon-essentials', '@storybook/addon-interactions'
    ],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    core: {
        disableTelemetry: true,
    },
    viteFinal: async (viteConfig) => {
        return {
            ...viteConfig,
            resolve: {
                ...viteConfig.resolve,
                alias: {
                    ...viteConfig.resolve?.alias,
                    // '@ton/appkit': path.resolve(__dirname, '../../appkit/src/index.ts'),
                    // '@ton/appkit/queries': path.resolve(__dirname, '../../appkit/src/queries/index.ts'),
                    // '@ton/appkit/tonconnect': path.resolve(
                    //     __dirname,
                    //     '../../appkit/src/connectors/tonconnect/index.ts',
                    // ),
                    // '@ton/walletkit': path.resolve(__dirname, '../../walletkit/src/index.ts'),
                },
            },
            css: {
                ...viteConfig.css,
                modules: {
                    localsConvention: 'camelCase',
                },
            },
            define: { 'process.env': {} },
            optimizeDeps: {
                ...viteConfig.optimizeDeps,
                include: [
                    ...(viteConfig.optimizeDeps?.include || []),
                    'react',
                    'react-dom',
                    'react/jsx-runtime',
                    'react/jsx-dev-runtime',
                ],
                esbuildOptions: {
                    ...viteConfig.optimizeDeps?.esbuildOptions,
                    plugins: [
                        ...(viteConfig.optimizeDeps?.esbuildOptions?.plugins || []),
                        NodeGlobalsPolyfillPlugin({
                            buffer: true,
                        }),
                    ],
                },
            },
        };
    },
};

export default config;
