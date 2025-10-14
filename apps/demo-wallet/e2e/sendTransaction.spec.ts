import { config } from 'dotenv';
import { expect } from '@playwright/test';
import { allureId, owner } from 'allure-js-commons';
import type { TestInfo } from '@playwright/test';

import { AllureApiClient, createAllureConfig, getTestCaseData, extractAllureId } from './utils';
import { testWithDemoWalletFixture } from './demo-wallet';
import type { TestFixture } from './qa';
config();

const test = testWithDemoWalletFixture({
    appUrl: process.env.DAPP_URL ?? 'https://allure-test-runner.vercel.app/e2e',
});
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
    console.log('DEBUG: isPositiveCase sendTransaction:', isPositiveCase);
    await wallet.sendTransaction(isPositiveCase, true);
    await expect(app.getByTestId('sendTransactionValidation')).toHaveText('Validation Passed');
}

// SendTransaction validation tests
test('[address] Error if absent @allureId(2221)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[address] Error if in HEX format @allureId(2244)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[address] Error if invalid value @allureId(2230)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[address] Success if in bounceable format @allureId(2226)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[address] Success if in non-bounceable format @allureId(2227)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[amount] Error if absent @allureId(2247)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[amount] Error if as a number @allureId(2231)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[amount] Error if insufficient balance @allureId(2245)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test("[amount] Success if '0' @allureId(2261)", async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

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

test('[from] Error if invalid value @allureId(2222)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[from] Success if in bounceable format @allureId(2252)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[from] Success if in HEX format @allureId(2229)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[from] Success if in non-bounceable format @allureId(2236)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[messages] Error if array is empty @allureId(2238)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[messages] Error if contains invalid message @allureId(2243)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[messages] Success if contains maximum messages @allureId(1959)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[network] Error if as a number @allureId(2234)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test("[network] Success if '-239' (mainnet) @allureId(2249)", async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[payload] Error if invalid value @allureId(2246)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[payload] Success if absent @allureId(2228)', async ({ wallet, app, widget }) => {
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

test('[stateInit] Success if valid value @allureId(2224)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Success if absent @allureId(2240)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Error if as a string @allureId(2239)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Error if expired @allureId(2235)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

// test('[validUntil] Error if has expired during confirmation @allureId(2237)', async ({ wallet, app, widget }) => {
//     await runSendTransactionTest({ wallet, app, widget }, test.info());
// });

test('[validUntil] Error if NaN @allureId(2241)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Error if NULL @allureId(2242)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Success if less then in 5 minutes @allureId(2225)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Success if more then in 5 minutes @allureId(2232)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

// Merkle proof/update tests
test('Send merkle proof @allureId(2256)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('Send merkle update @allureId(2257)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

// Jetton minting tests
test('Minting Jetton with Deployed Contract @allureId(1898)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});