// import { StrykerOptions } from '@stryker-mutator/core';

import { target } from './quality.config.ts';

const config = {
    packageManager: 'pnpm',
    reporters: ['html', 'clear-text', 'progress'],
    testRunner: 'command',
    commandRunner: {
        command: 'pnpm test',
    },
    coverageAnalysis: 'perTest',
    symlinkNodeModules: false,
    inPlace: false,
    mutate: ['src/contracts/w5/WalletV5R1Adapter.ts', 'src/core/TonWalletKit.ts', 'src/utils/base64.ts'],
    tempDirName: '.stryker-tmp',
    cleanTempDir: true,
    timeoutMS: 60000,
    logLevel: 'info',
    thresholds: {
        break: target.mutation,
    },
    mutator: {
        excludedMutations: ['StringLiteral', 'TemplateLiteral', 'ArrayLiteral', 'ObjectLiteral'],
    },
    ignorePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/.stryker-tmp/**',
        '**/vite.config.ts',
        '**/vitest.config.ts',
    ],
};

export default config;
