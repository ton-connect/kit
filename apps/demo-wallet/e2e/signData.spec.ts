import { config } from 'dotenv';
import { allure } from 'allure-playwright';

// Загружаем переменные окружения
config();
import { expect } from '@playwright/test';
import type { TestInfo } from '@playwright/test';

import { AllureApiClient, createAllureConfig, getTestCaseData, extractAllureId } from './utils';
import { testWithDemoWalletFixture } from './demo-wallet';
import type { TestFixture } from './qa';

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

async function runSignDataTest(
    { wallet, app, widget }: Pick<TestFixture, 'wallet' | 'app' | 'widget'>,
    testInfo: TestInfo,
) {
    const allureId = extractAllureId(testInfo.title);
    if (allureId) {
        await allure.allureId(allureId);
        await allure.owner('e.kurilenko');
    }
    let precondition: string = '';
    let expectedResult: string = '';
    let isPositiveCase: boolean = true;

    if (allureId && allureClient) {
        try {
            const testCaseData = await getTestCaseData(allureClient, allureId);
            precondition = testCaseData.precondition;
            expectedResult = testCaseData.expectedResult;
            //isPositiveCase = testCaseData.isPositiveCase; will use it for negative cases later
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error getting test case data:', error);
        }
    } else {
        // eslint-disable-next-line no-console
        console.warn('AllureId not found in test title or client not available');
    }
    await expect(widget.connectButtonText).toHaveText('Connect Wallet');
    await wallet.connectBy(await widget.connectUrl());
    await expect(widget.connectButtonText).not.toHaveText('Connect Wallet');
    await app.getByTestId('signDataPrecondition').fill(precondition);
    await app.getByTestId('signDataExpectedResult').fill(expectedResult);
    await app.getByTestId('sign-data-button').click();

    await wallet.signData(true);

    await expect(app.getByTestId('signDataValidation')).toHaveText('Validation Passed');
}

test('Sign text @allureId(1918)', async ({ wallet, app, widget }) => {
    await runSignDataTest({ wallet, app, widget }, test.info());
});

test('Sign cell @allureId(1920)', async ({ wallet, app, widget }) => {
    await runSignDataTest({ wallet, app, widget }, test.info());
});

test('Sign binary @allureId(1919)', async ({ wallet, app, widget }) => {
    await runSignDataTest({ wallet, app, widget }, test.info());
});
