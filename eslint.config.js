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
    { ignores: ['**/dist/*', '**/dist-extension/*', 'apps/ioskit/*'] },
];
