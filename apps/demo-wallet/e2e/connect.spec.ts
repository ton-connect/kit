import { expect } from '@playwright/test';
import { testWith } from './qa';
import { demoWalletFixture } from './demo-wallet';
import { AllureApiClient, createAllureConfig, getTestCaseData } from './utils';
import { allure } from 'allure-playwright';

const test = testWith(
    demoWalletFixture({
        extensionPath: 'dist-extension',
        mnemonic: process.env.WALLET_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        appUrl: process.env.DAPP_URL || 'https://allure-test-runner.vercel.app/e2e '
    }),
);

let allureClient: AllureApiClient;

// Функция для извлечения allureId из названия теста
function extractAllureId(testTitle: string): string | null {
  const match = testTitle.match(/@allureId\((\d+)\)/);
  return match ? match[1] : null;
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

async function runConnectTest(
  { wallet, app, widget }: { wallet: any; app: any; widget: any }, 
  testInfo: any) {
  // Извлекаем allureId из названия теста
  const allureId = extractAllureId(testInfo.title);

  // Устанавливаем Allure аннотации
  if (allureId) {
    await allure.allureId(allureId);
    await allure.owner('e.kurilenko');
  }

  await expect(widget.connectButtonText).toHaveText('Connect Wallet');
  await wallet.connectBy(await widget.connectUrl());
  await expect(widget.connectButtonText).toHaveText('UQC8…t2Iv');

  // Инициализируем переменные для данных тест-кейса
  let preconditions: string = "";
  let expectedResult: string = "";
  let isPositiveCase: boolean = true;

  if (allureId && allureClient) {
    try {
    const testCaseData = await getTestCaseData(allureClient, allureId);
    preconditions = testCaseData.preconditions;
    expectedResult = testCaseData.expectedResult;
    isPositiveCase = testCaseData.isPositiveCase;
    } catch (error) {
    console.error('Error getting test case data:', error);
    }
  } else {
    console.warn('AllureId not found in test title or client not available');
  }

  await app.locator('#signDataPrecondition').fill(preconditions);
  await app.locator('#signDataExpectedResult').fill(expectedResult);
  await app.getByRole('button', {name: 'Sign Data'}).click();

  await wallet.signData(true, isPositiveCase);

  await app.getByText('✅ Validation Passed').waitFor({ state: 'visible' });
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

// test('Sign Data', async ({ wallet, app, widget }) => {
//     await expect(widget.connectButtonText).toHaveText('Connect Wallet');
//     await wallet.connectBy(await widget.connectUrl());
//     await expect(widget.connectButtonText).toHaveText('UQC8…t2Iv');
//     await app.getByRole('button', { name: 'Sign Data' }).click();
//     await wallet.signData();
//     const signDataResultSelector = app.locator('.sign-data-result');
//     await expect(signDataResultSelector).toHaveText('✅ TEXT Verification Result');
// });