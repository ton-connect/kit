/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        alias: {
            '@ton/walletkit': path.resolve(__dirname, 'src/__mocks__/@ton/walletkit.ts'),
        },
        setupFiles: ['./src/__tests__/setup.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts', 'src/**/*.tsx'],
            exclude: ['src/index.ts', 'src/lib/walletManifest.ts', 'src/__mocks__/**', 'src/__tests__/**'],
            thresholds: {
                lines: 74,
                branches: 62,
                functions: 77,
                statements: 73,
            },
        },
    },
});
