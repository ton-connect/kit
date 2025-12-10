/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AllureApiClient, createAllureConfig, preloadTestCases } from '../utils';
import { testWithDemoWalletFixture } from '../demo-wallet';
import { runSendTransactionTest } from '../runTest';
import { collectAllAllureIds } from '../testCasePreloader';

const test = testWithDemoWalletFixture({
    appUrl: process.env.DAPP_URL ?? 'https://allure-test-runner.vercel.app/e2e',
});

// Global variable for storing the Allure client
let allureClient: AllureApiClient;

test.beforeAll(async () => {
    try {
        const config = createAllureConfig();
        allureClient = new AllureApiClient(config);

        // Preload all test cases data in parallel
        const allureIds = collectAllAllureIds();
        await preloadTestCases(allureClient, allureIds);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error creating allure client:', error);
        throw error;
    }
});

test('[stateInit] Success if valid value @allureId(2224)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[validUntil] Success if absent @allureId(2240)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[validUntil] Error if as a string @allureId(2239)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[validUntil] Error if expired @allureId(2235)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

//waiting for TONTECH-829 to be fixed
// test('[validUntil] Error if has expired during confirmation @allureId(2237)', async ({ wallet, app, widget }) => {
//     await runSendTransactionTest({ wallet, app, widget }, test.info(), { waitBeforeApprove: 3000 });
// });

test('[validUntil] Error if NaN @allureId(2241)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});
