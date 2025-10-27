/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const toolchainConfig = require('@ton/toolchain');
const globals = require('globals');
const licenseHeader = require('eslint-plugin-license-header');

module.exports = [
    ...toolchainConfig,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                // ...globals.nodeBuiltin
            },
        },
        rules: {},
    },
    {
        ignores: [
            '**/*report/*',
            '**/dist/*',
            '**/*stryker*/*',
            '**/*coverage*/*',
            '**/dist-extension/*',
            '**/Packages/TONWalletKit/*',
            '**/TONWalletApp/TONWalletApp/*',
            '**/androidkit/**',
        ],
    },
    {
        files: ['**/**/*.ts', '**/**/*.tsx'],
        plugins: {
            'license-header': licenseHeader,
        },
        rules: {
            'license-header/header': ['error', './resources/license-header.js'],
        },
    },
];
