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
            '@tonconnect/sdk': path.resolve(__dirname, 'src/__mocks__/@tonconnect/sdk.ts'),
            '@tonconnect/ui-react': path.resolve(__dirname, 'src/__mocks__/@tonconnect/ui-react.ts'),
        },
        setupFiles: ['./src/__tests__/setup.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts', 'src/**/*.tsx'],
            exclude: [
                'src/index.ts',
                'src/lib/walletManifest.ts',
                'src/__mocks__/**',
                'src/__tests__/**',
                'src/appkit/react-hook.tsx', // React hook requires browser environment
            ],
            thresholds: {
                lines: 60,
                branches: 60,
                functions: 50,
                statements: 60,
            },
        },
    },
});
