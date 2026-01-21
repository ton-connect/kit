/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from 'tsup';
import { solidPlugin } from 'esbuild-plugin-solid';

import * as packageJson from './package.json';

export default defineConfig([
    {
        entry: ['src/index.ts'],
        format: ['esm', 'cjs'],
        dts: true,
        clean: true,
        outDir: 'lib',
        external: [
            'classnames',
            'deepmerge',
            '@ton/appkit',
            'ua-parser-js',
            'solid-js',
            'solid-js/web',
            'solid-styled-components',
        ],
        platform: 'browser',
        target: 'es2020',
        sourcemap: true,
        minify: true,
        splitting: true,
        treeshake: {
            preset: 'smallest',
        },
        esbuildPlugins: [solidPlugin()],
        define: {
            'process.env': '{}',
            TON_CONNECT_UI_VERSION: JSON.stringify(packageJson.version),
        },
    },
    {
        entry: ['src/index.ts'],
        format: ['iife'],
        outDir: 'dist',
        platform: 'browser',
        target: 'es2020',
        sourcemap: true,
        minify: true,
        treeshake: {
            preset: 'smallest',
        },
        globalName: 'TON_CONNECT_UI',
        esbuildPlugins: [solidPlugin()],
        define: {
            'process.env': '{}',
            TON_CONNECT_UI_VERSION: JSON.stringify(packageJson.version),
        },
    },
]);
