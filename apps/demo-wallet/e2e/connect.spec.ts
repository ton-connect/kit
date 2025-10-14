import type { TestInfo } from '@playwright/test';
import { allureId, owner } from 'allure-js-commons';

import { testWithDemoWalletFixture } from './demo-wallet';
import type { TestFixture } from './qa';
import { AllureApiClient, createAllureConfig, getTestCaseData, extractAllureId } from './utils';

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
        await owner('e.kurilenko');
    }
    let precondition: string = '';
    let expectedResult: string = '';

    if (testAllureId && allureClient) {
        const testCaseData = await getTestCaseData(allureClient, testAllureId);
        precondition = testCaseData.precondition;
        expectedResult = testCaseData.expectedResult;
    }

    await app.getByTestId('connectPrecondition').fill(precondition || '');
    await app.getByTestId('connectExpectedResult').fill(expectedResult);
    await expect(app.getByTestId('connect-button')).toHaveText('Connect Wallet');
    await wallet.connectBy(await widget.connectUrl(await app.getByTestId('connect-button')));
    await app.getByTestId('connectValidation').waitFor({ state: 'visible' });
    await expect(app.getByTestId('connectValidation')).toHaveText('Validation Passed', { timeout: 1 });
}

test('Connect @allureId(1933)', async ({ wallet, app, widget }) => {
    await runConnectTest({ wallet, app, widget }, test.info());
});

test('Connect @allureId(1900)', async ({ wallet, app, widget }) => {
    await runConnectTest({ wallet, app, widget }, test.info());
});

test('Connect @allureId(1902)', async ({ wallet, app, widget }) => {
    await runConnectTest({ wallet, app, widget }, test.info());
});
