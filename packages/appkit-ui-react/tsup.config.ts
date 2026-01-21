/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from 'tsup';

import * as packageJson from './package.json';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    outDir: 'dist',
    external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', '@ton/appkit-ui'],
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
    minify: true,
    treeshake: {
        preset: 'smallest',
    },
    splitting: false,
    esbuildOptions(options) {
        options.jsx = 'automatic';
    },
    define: {
        'process.env': '{}',
        TON_CONNECT_UI_REACT_VERSION: JSON.stringify(packageJson.version),
    },
});
