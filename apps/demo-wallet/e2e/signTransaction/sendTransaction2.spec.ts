import { allureId, owner } from 'allure-js-commons';
import type { TestInfo } from '@playwright/test';

import { AllureApiClient, createAllureConfig, getTestCaseData, extractAllureId } from '../utils';
import { testWithDemoWalletFixture } from '../demo-wallet';
import type { TestFixture } from '../qa';

const test = testWithDemoWalletFixture({
    appUrl: process.env.DAPP_URL ?? 'https://allure-test-runner.vercel.app/e2e',
});
const { expect } = test;

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

async function runSendTransactionTest(
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
    let isPositiveCase: boolean = true;

    if (testAllureId && allureClient) {
        try {
            const testCaseData = await getTestCaseData(allureClient, testAllureId);
            precondition = testCaseData.precondition;
            expectedResult = testCaseData.expectedResult;
            isPositiveCase = testCaseData.isPositiveCase;
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
    await app.getByTestId('sendTxPrecondition').fill(precondition);
    await app.getByTestId('sendTxExpectedResult').fill(expectedResult);
    await app.getByTestId('send-transaction-button').click();

    await wallet.sendTransaction(isPositiveCase, true);

    await expect(app.getByTestId('sendTransactionValidation')).toHaveText('Validation Passed');
}

// SendTransaction validation tests
// test('[address] Error if absent @allureId(1847)', async ({ wallet, app, widget }) => {
//     await runSendTransactionTest({ wallet, app, widget }, test.info());
// });

// test('[address] Error if in HEX format @allureId(1870)', async ({ wallet, app, widget }) => {
//     await runSendTransactionTest({ wallet, app, widget }, test.info());
// });

// test('[address] Error if invalid value @allureId(1856)', async ({ wallet, app, widget }) => {
//     await runSendTransactionTest({ wallet, app, widget }, test.info());
// });

// test('[address] Success if in bounceable format @allureId(1852)', async ({ wallet, app, widget }) => {
//     await runSendTransactionTest({ wallet, app, widget }, test.info());
// });

// test('[address] Success if in non-bounceable format @allureId(1853)', async ({ wallet, app, widget }) => {
//     await runSendTransactionTest({ wallet, app, widget }, test.info());
// });

// test('[amount] Error if absent @allureId(1873)', async ({ wallet, app, widget }) => {
//     await runSendTransactionTest({ wallet, app, widget }, test.info());
// });

test('[amount] Error if as a number @allureId(1857)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[amount] Error if insufficient balance @allureId(1871)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test("[amount] Success if '0' @allureId(1980)", async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[amount] Success if as a string @allureId(1849)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test("[from] Error if address doesn't match the user's wallet address @allureId(1877)", async ({
    wallet,
    app,
    widget,
}) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[payload] Success if valid value @allureId(1879)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[stateInit] Error if invalid value @allureId(1874)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[stateInit] Success if absent @allureId(1859)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});
