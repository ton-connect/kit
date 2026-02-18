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
    entry: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/__tests__/**'],
    format: ['esm', 'cjs'],
    bundle: false,
    dts: false,
    clean: true,
    outDir: 'dist',
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
    minify: false,
    define: {
        'process.env': '{}',
        TON_APPKIT_VERSION: JSON.stringify(packageJson.version),
    },
});
