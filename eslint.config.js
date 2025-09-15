const toolchainConfig = require('@ton/toolchain');
const globals = require('globals');

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
            '**/dist/*',
            '**/*stryker*/*',
            '**/*coverage*/*',
            '**/dist-extension/*',
            '**/Packages/TONWalletKit/Sources/TONWalletKit/Resources/JS/*',
        ],
    },
];
