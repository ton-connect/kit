//import * as allure from 'allure-js-commons';

import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import type { TestInfo } from '@playwright/test';

import { testWithDemoWalletFixture } from './demo-wallet';
import { AllureApiClient, createAllureConfig, getTestCaseData, extractAllureId } from './utils';
import type { TestFixture } from './qa';
const test = testWithDemoWalletFixture({
    appUrl: process.env.DAPP_URL ?? 'https://allure-test-runner.vercel.app/e2e',
});
//const { expect } = test;

// const test = testWith(
//     demoWalletFixture({
//         extensionPath: 'dist-extension',
//         mnemonic:
//             process.env.WALLET_MNEMONIC ||
//             'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
//         appUrl: process.env.DAPP_URL || 'https://allure-test-runner.vercel.app/e2e '
//     }, 0),
// );

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

async function runConnectTest(
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

    if (allureId && allureClient) {
        try {
            const testCaseData = await getTestCaseData(allureClient, allureId);
            precondition = testCaseData.precondition;
            expectedResult = testCaseData.expectedResult;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error getting test case data:', error);
        }
    } else {
        // eslint-disable-next-line no-console
        console.warn('AllureId not found in test title or client not available');
    }

    await app.getByTestId('connectPrecondition').fill(precondition || '');
    await app.getByTestId('connectExpectedResult').fill(expectedResult);
    await expect(app.getByTestId('connect-button')).toHaveText('Connect Wallet');

    await app.getByTestId('connect-button').click();

    await widget.connectUrlButton.waitFor({ state: 'visible' });
    await widget.connectUrlButton.click();

    await wallet.connectBy(await widget.connectUrl());

    //await wallet.connect(true, await handle.jsonValue());

    //await wallet.connect();

    await expect(app.getByTestId('connectValidation')).toHaveText('Validation Passed');
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
