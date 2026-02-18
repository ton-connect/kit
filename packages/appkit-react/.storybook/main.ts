/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StorybookConfig } from '@storybook/react-vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(ts|tsx)'],
    addons: ['@storybook/addon-docs'],
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
            plugins: [...(viteConfig.plugins ?? []), nodePolyfills()],
            resolve: {
                ...viteConfig.resolve,
                alias: {
                    ...viteConfig.resolve?.alias,
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
                    plugins: [...(viteConfig.optimizeDeps?.esbuildOptions?.plugins || [])],
                },
            },
        };
    },
};

export default config;
