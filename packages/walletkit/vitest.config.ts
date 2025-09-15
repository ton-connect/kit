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
