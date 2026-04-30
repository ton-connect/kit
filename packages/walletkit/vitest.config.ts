/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from 'vitest/config';
import type { ViteUserConfig } from 'vitest/config';

import { target } from './quality.config.js';

const config: ViteUserConfig = defineConfig({
    test: {
        typecheck: {
            tsconfig: './tsconfig.test.json',
        },
        globals: true,
        environment: 'node',
        include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
        exclude: ['node_modules', 'dist', 'build', 'coverage', '.stryker-tmp', '**/*.config.ts', '**/*.config.js'],
        // WebStorm compatibility
        reporter: process.env.JETBRAINS_IDE ? ['verbose'] : ['default'],
        // Disable WebStorm-specific reporter
        onConsoleLog: () => false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            all: true,
            perFile: true,
            reportOnFailure: true,
            thresholds: {
                statements: target.coverage,
            },
            exclude: [
                'node_modules/',
                '**/node_modules/**',
                '**/dist/**',
                '**/*.spec.ts',
                '**/examples/**',
                '**/coverage/**',
                '**/.stryker-tmp/**',
                '**/*.config.ts',
                '**/*.config.js',
            ],
        },
    },
});

export default config;
