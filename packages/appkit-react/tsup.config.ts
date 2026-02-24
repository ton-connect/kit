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
    entry: ['src/**/*.{ts,tsx,js,jsx,mjs,css}'],
    format: ['esm', 'cjs'],
    bundle: false,
    dts: false,
    clean: true,
    outDir: 'dist',
    external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
    minify: false,
    treeshake: {
        preset: 'smallest',
    },
    splitting: false,
    esbuildOptions(options) {
        options.jsx = 'automatic';
    },
    define: {
        TON_APPKIT_UI_REACT_VERSION: JSON.stringify(packageJson.version),
    },
    onSuccess: 'tsc --emitDeclarationOnly',
});
