import { expect } from '@playwright/test';
import { AllureApiClient, createAllureConfig, getTestCaseData, extractAllureId } from './utils';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { allure } from 'allure-playwright';
import { testWith } from './qa';
import { demoWalletFixture } from './demo-wallet';

// Создаем тест с использованием demoWalletFixture
const test = testWith(
    demoWalletFixture({
        extensionPath: 'dist-extension',
        mnemonic: process.env.WALLET_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        appUrl: process.env.DAPP_URL || 'https://allure-test-runner.vercel.app/e2e'
    }),
);
// Global variable for storing the Allure client
let allureClient: AllureApiClient;

// Function for extracting allureId from the test title

// universal function for executing SendTransaction test
async function runSendTransactionTest(
  { wallet, app, widget }: { wallet: any; app: any; widget: any }, 
  testInfo: any
) {
  const allureId = extractAllureId(testInfo.title);
  
  if (allureId) {
    await allure.allureId(allureId);
    await allure.owner('e.kurilenko');
  }
  
  // Инициализируем переменные для данных тест-кейса
  let precondition: string = "";
  let expectedResult: string = "";
  let isPositiveCase: boolean = true;

  if (allureId && allureClient) {
    try {
      const testCaseData = await getTestCaseData(allureClient, allureId);
      precondition = testCaseData.precondition;
      expectedResult = testCaseData.expectedResult;
      isPositiveCase = testCaseData.isPositiveCase;
    } catch (error) {
      console.error('Error getting test case data:', error);
    }
  } else {
    console.warn('AllureId not found in test title or client not available');
  }

  await expect(widget.connectButtonText).toHaveText('Connect Wallet');
  await wallet.connectBy(await widget.connectUrl());
  await expect(widget.connectButtonText).toHaveText('UQC8…t2Iv');

  await app.locator('#sendTxPrecondition').fill(precondition);
  await app.locator('#sendTxExpectedResult').fill(expectedResult);
  await app.locator('#send-transaction-button').click();
  //await app.getByRole('button', {name: 'Send Transaction'}).click();

  await wallet.sendTransaction(true, isPositiveCase);

  await expect(app.getByTestId('sendTransactionValidation')).toHaveText('Validation Passed');
}

test.beforeAll(async () => {
  try {
    // Создаем конфигурацию Allure
    const config = createAllureConfig();
    
    // Создаем клиент Allure
    allureClient = new AllureApiClient(config);
    
  } catch (error) {
    console.error('Error creating allure client:', error);
    throw error;
  } 
});

// SendTransaction validation tests
test('[address] Error if absent @allureId(1847)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[address] Error if in HEX format @allureId(1870)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[address] Error if invalid value @allureId(1856)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[address] Success if in bounceable format @allureId(1852)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[address] Success if in non-bounceable format @allureId(1853)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[amount] Error if absent @allureId(1873)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[amount] Error if as a number @allureId(1857)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[amount] Error if insufficient balance @allureId(1871)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[amount] Success if \'0\' @allureId(1980)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[amount] Success if as a string @allureId(1849)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[from] Error if address doesn\'t match the user\'s wallet address @allureId(1877)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[from] Error if invalid value @allureId(1848)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[from] Success if in bounceable format @allureId(1878)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[from] Success if in HEX format @allureId(1855)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[from] Success if in non-bounceable format @allureId(1862)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[messages] Error if array is empty @allureId(1864)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[messages] Error if contains invalid message @allureId(1869)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[messages] Success if contains maximum messages @allureId(1959)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[network] Error if \'-3\' (testnet) @allureId(1876)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[network] Error if as a number @allureId(1860)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[network] Success if \'-239\' (mainnet) @allureId(1875)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[payload] Error if invalid value @allureId(1872)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[payload] Success if absent @allureId(1854)', async ({ wallet, app, widget }) => {
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

test('[stateInit] Success if valid value @allureId(1850)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Success if absent @allureId(1866)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Error if as a string @allureId(1865)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Error if expired @allureId(1861)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Error if has expired during confirmation @allureId(1863)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Error if NaN @allureId(1867)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Error if NULL @allureId(1868)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Success if less then in 5 minutes @allureId(1851)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('[validUntil] Success if more then in 5 minutes @allureId(1858)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

// Merkle proof/update tests
test('Send merkle proof @allureId(1916)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

test('Send merkle update @allureId(1917)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});

// Jetton minting tests
test('Minting Jetton with Deployed Contract @allureId(1899)', async ({ wallet, app, widget }) => {
    await runSendTransactionTest({ wallet, app, widget }, test.info());
});