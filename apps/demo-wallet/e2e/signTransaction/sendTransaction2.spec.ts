import { allureId, owner } from 'allure-js-commons';
import type { TestInfo } from '@playwright/test';

import { AllureApiClient, createAllureConfig, getTestCaseData, extractAllureId } from '../utils';
import { testWithDemoWalletFixture } from '../demo-wallet';
import type { TestFixture } from '../qa';

const isExtension = process.env.E2E_JS_BRIDGE === 'true';

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
    if (isExtension) {
        await widget.connectWallet('Tonkeeper');
        await wallet.connect(true);
    } else {
        await wallet.connectBy(await widget.connectUrl());
        await expect(widget.connectButtonText).not.toHaveText('Connect Wallet');
    }
    await app.getByTestId('sendTxPrecondition').fill(precondition);
    await app.getByTestId('sendTxExpectedResult').fill(expectedResult);
    await app.getByTestId('send-transaction-button').click();

    await wallet.sendTransaction(isPositiveCase, true);

    await expect(app.getByTestId('sendTransactionValidation')).toHaveText('Validation Passed');
}

test('[amount] Error if as a number @allureId(2231)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[amount] Error if insufficient balance @allureId(2245)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

// test("[amount] Success if '0' @allureId(2261)", async ({ wallet, app, widget }) => {
//     await runSendTransactionTest({ wallet, app, widget }, test.info());
// });

test('[amount] Success if as a string @allureId(2223)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test("[from] Error if address doesn't match the user's wallet address @allureId(2251)", async ({
    wallet,
    app,
    widget,
}) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[payload] Success if valid value @allureId(2253)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[stateInit] Error if invalid value @allureId(2248)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[stateInit] Success if absent @allureId(2233)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});
