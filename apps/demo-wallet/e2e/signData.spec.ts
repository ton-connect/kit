import { testWith } from './qa';
import { demoWalletFixture } from './demo-wallet';
import { AllureApiClient, createAllureConfig, getTestCaseData, extractAllureId } from './utils';
import { allure, expect } from 'allure-playwright';

const test = testWith(
    demoWalletFixture({
        extensionPath: 'dist-extension',
        mnemonic: process.env.WALLET_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        appUrl: process.env.DAPP_URL || 'https://allure-test-runner.vercel.app/e2e '
    }),
);

let allureClient: AllureApiClient;

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

async function runSignDataTest(
  { wallet, app, widget }: { wallet: any; app: any; widget: any }, 
  testInfo: any) {
  // Извлекаем allureId из названия теста
  const allureId = extractAllureId(testInfo.title);

  // Устанавливаем Allure аннотации
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


  await app.locator('#signDataPrecondition').fill(precondition);
  await app.locator('#signDataExpectedResult').fill(expectedResult);
  await app.locator('#sign-data-button').click();
  //await app.getByRole('button', {name: 'Sign Data'}).click();

  await wallet.signData(true, isPositiveCase);

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