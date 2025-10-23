import { config } from 'dotenv';
import type { TestInfo } from '@playwright/test';
import { allureId, suite, tags, label } from 'allure-js-commons';

// Загружаем переменные окружения
config();

import { testWithDemoWalletFixture } from './demo-wallet';
import type { TestFixture } from './qa';
import { AllureApiClient, createAllureConfig, getTestCaseData, extractAllureId } from './utils';

const isExtension = process.env.E2E_JS_BRIDGE === 'true';

const test = testWithDemoWalletFixture({
    appUrl: process.env.DAPP_URL ?? 'https://allure-test-runner.vercel.app/e2e',
});
const { expect } = test;

let allureClient: AllureApiClient;

test.beforeAll(async () => {
    const config = createAllureConfig();
    allureClient = new AllureApiClient(config);
});

async function runConnectTest(
    { wallet, app, widget }: Pick<TestFixture, 'wallet' | 'app' | 'widget'>,
    testInfo: TestInfo,
) {
    const testAllureId = extractAllureId(testInfo.title);
    if (testAllureId) {
        await allureId(testAllureId);
        await suite('JS result');
        await label('sub-suite', 'Connect');
        await tags('connect', 'automated');
    }
    let precondition: string = '';
    let expectedResult: string = '';

    if (testAllureId && allureClient) {
        const testCaseData = await getTestCaseData(allureClient, testAllureId);
        precondition = testCaseData.precondition;
        expectedResult = testCaseData.expectedResult;
    }

    const shouldSkipConnect = testInfo.title.includes('[ERROR]');
    await app.getByTestId('connectPrecondition').fill(precondition || '');
    await app.getByTestId('connectExpectedResult').fill(expectedResult);
    await expect(app.getByTestId('connect-button')).toHaveText('Connect Wallet');

    if (isExtension) {
        app.getByTestId('connect-button').click();
        widget.connectWallet('Tonkeeper', true);
        wallet.connect(true, shouldSkipConnect);
    } else {
        wallet.connectBy(await widget.connectUrl(await app.getByTestId('connect-button')));
        expect(widget.connectButtonText).not.toHaveText('Connect Wallet');
    }

    await app.getByTestId('connectValidation').waitFor({ state: 'visible' });
    await expect(app.getByTestId('connectValidation')).toHaveText('Validation Passed', { timeout: 1 });
}

// test('Connect @allureId(1933)', async ({ wallet, app, widget }) => {
//     await runConnectTest({ wallet, app, widget }, test.info());
// });

test('Successful Connect @allureId(2294)', async ({ wallet, app, widget }) => {
    await runConnectTest({ wallet, app, widget }, test.info());
});

test('[ERROR] Connect with invalid manifest url@allureId(2254)', async ({ wallet, app, widget }) => {
    await runConnectTest({ wallet, app, widget }, test.info());
});

test('[ERROR]Connect with invalid app url in the manifest @allureId(2255)', async ({ wallet, app, widget }) => {
    await runConnectTest({ wallet, app, widget }, test.info());
});
