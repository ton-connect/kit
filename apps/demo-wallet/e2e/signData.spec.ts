/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { config } from 'dotenv';

import { AllureApiClient, createAllureConfig } from './utils';
import { testWithDemoWalletFixture } from './demo-wallet';
import { runSignDataTest } from './runTest';

config();

const test = testWithDemoWalletFixture({
    appUrl: process.env.DAPP_URL ?? 'https://allure-test-runner.vercel.app/e2e',
});

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

test('Sign text @allureId(2258)', async ({ wallet, app, widget }) => {
    await runSignDataTest({ wallet, app, widget }, test.info(), allureClient);
});

test('Sign cell @allureId(2260)', async ({ wallet, app, widget }) => {
    await runSignDataTest({ wallet, app, widget }, test.info(), allureClient);
});

test('Sign binary @allureId(2259)', async ({ wallet, app, widget }) => {
    await runSignDataTest({ wallet, app, widget }, test.info(), allureClient);
});
