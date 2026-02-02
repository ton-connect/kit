/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { config } from 'dotenv';

// Загружаем переменные окружения
config({ quiet: true });

import { testWithDemoWalletFixture } from './demo-wallet';
import { AllureApiClient, createAllureConfig } from './utils';
import { runConnectTest } from './runTest';

const test = testWithDemoWalletFixture({
    appUrl: process.env.DAPP_URL ?? 'https://allure-test-runner.vercel.app/e2e',
});

let allureClient: AllureApiClient;

test.beforeAll(async () => {
    const config = createAllureConfig();
    allureClient = new AllureApiClient(config);
});

test('Successful Connect @allureId(2294)', async ({ wallet, app, widget }) => {
    await runConnectTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[ERROR] Connect with invalid manifest url@allureId(2254)', async ({ wallet, app, widget }) => {
    await runConnectTest({ wallet, app, widget }, test.info(), allureClient);
});

test('[ERROR] Connect with invalid app url in the manifest @allureId(2255)', async ({ wallet, app, widget }) => {
    await runConnectTest({ wallet, app, widget }, test.info(), allureClient);
});

test('User declined the connection @allureId(1889)', async ({ wallet, app, widget }) => {
    await runConnectTest({ wallet, app, widget }, test.info(), allureClient);
});
