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

test('[messages] Error if contains invalid message @allureId(1869)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[messages] Success if contains maximum messages @allureId(1959)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test("[network] Error if '-3' (testnet) @allureId(1876)", async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[network] Error if as a number @allureId(1860)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test("[network] Success if '-239' (mainnet) @allureId(1875)", async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[payload] Error if invalid value @allureId(1872)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[payload] Success if absent @allureId(1854)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});
