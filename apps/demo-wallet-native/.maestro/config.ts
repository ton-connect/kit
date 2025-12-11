/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface TestConfig {
    name: string;
    file: string;
    allureId?: string;
}

export interface TestsConfig {
    tests: TestConfig[];
}

export const config: TestsConfig = {
    tests: [
        {
            name: 'Import wallet',
            file: 'tests/import-wallet.yaml',
        },
        {
            name: 'Connect/Disconnect',
            file: 'tests/connect-disconnect.yaml',
        },
        // {
        //     name: 'Sign text',
        //     file: 'tests/sign-data-test.yaml',
        //     allureId: '2258',
        // },
        // {
        //     name: 'Sign cell',
        //     file: 'tests/sign-data-test.yaml',
        //     allureId: '2260',
        // },
        // {
        //     name: 'Sign binary',
        //     file: 'tests/sign-data-test.yaml',
        //     allureId: '2259',
        // },
    ],
};
