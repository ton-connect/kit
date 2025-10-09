import { AllureApiClient, createAllureConfig, getTestCaseData, extractAllureId } from './utils';
import { allure } from 'allure-playwright';
import { expect } from '@playwright/test';
import { testWithDemoWalletFixture } from './demo-wallet';

const feature = {
    jsBridge: Boolean(process.env.E2E_JS_BRIDGE),
};
const test = testWithDemoWalletFixture({
    appUrl: process.env.DAPP_URL ?? 'https://allure-test-runner.vercel.app/e2e',
});

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
  // Подключаем кошелек
  await expect(widget.connectButtonText).toHaveText('Connect Wallet');
  await wallet.connectBy(await widget.connectUrl());
  await expect(widget.connectButtonText).not.toHaveText('Connect Wallet');

  // Заполняем данные для подписи
  await app.getByTestId('signDataPrecondition').fill(precondition);
  await app.getByTestId('signDataExpectedResult').fill(expectedResult);
  await app.getByTestId('sign-data-button').click();

  // Подписываем данные
  await wallet.signData(isPositiveCase);

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