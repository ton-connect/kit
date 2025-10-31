/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AllureApiClient, createAllureConfig } from '../utils';
import { testWithDemoWalletFixture } from '../demo-wallet';
import { runSendTransactionTest } from '../runTest';

const test = testWithDemoWalletFixture({
    appUrl: process.env.DAPP_URL ?? 'https://allure-test-runner.vercel.app/e2e',
});

// Global variable for storing the Allure client
let allureClient: AllureApiClient;

test.beforeAll(async () => {
    try {
        const config = createAllureConfig();
        allureClient = new AllureApiClient(config);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error creating allure client:', error);
        throw error;
    }
});

test('[messages] Error if contains invalid message @allureId(2243)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[messages] Success if contains maximum messages @allureId(1959)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[network] Error if as a number @allureId(2234)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test("[network] Success if '-239' (mainnet) @allureId(2249)", async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[payload] Error if invalid value @allureId(2246)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[payload] Success if absent @allureId(2228)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});
