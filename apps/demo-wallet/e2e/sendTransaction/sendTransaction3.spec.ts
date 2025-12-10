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

test('[from] Error if invalid value @allureId(2222)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[from] Success if in bounceable format @allureId(2252)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[from] Success if in HEX format @allureId(2229)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[from] Success if in non-bounceable format @allureId(2236)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[messages] Error if array is empty @allureId(2238)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[validUntil] Error if NULL @allureId(2242)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[validUntil] Success if less then in 5 minutes @allureId(2225)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[validUntil] Success if more then in 5 minutes @allureId(2232)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});
