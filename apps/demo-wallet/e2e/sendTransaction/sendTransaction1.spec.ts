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

// SendTransaction validation tests
test('[address] Error if absent @allureId(2221)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[address] Error if in HEX format @allureId(2244)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[address] Error if invalid value @allureId(2230)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[address] Success if in bounceable format @allureId(2226)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[address] Success if in non-bounceable format @allureId(2227)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[amount] Error if absent @allureId(2247)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

// Merkle proof/update tests
test('Send merkle proof @allureId(2256)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('Send merkle update @allureId(2257)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

// Jetton minting tests
test('Minting Jetton with Deployed Contract @allureId(1898)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});

test('User declined the transaction @allureId(1908)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info(), allureClient);
});
