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

test('[amount] Error if as a number @allureId(2231)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[amount] Error if insufficient balance @allureId(2245)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test("[amount] Success if '0' @allureId(2261)", async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[amount] Success if as a string @allureId(2223)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test("[from] Error if address doesn't match the user's wallet address @allureId(2251)", async ({
    wallet,
    app,
    widget,
}) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[payload] Success if valid value @allureId(2253)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[stateInit] Error if invalid value @allureId(2248)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[stateInit] Success if absent @allureId(2233)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});
