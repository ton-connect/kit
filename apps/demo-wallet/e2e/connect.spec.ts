import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

import { testWith } from './qa';
import { demoWalletFixture } from './demo-wallet';
import { AllureApiClient, createAllureConfig, getTestCaseData, extractAllureId } from './utils';

const test = testWith(
    demoWalletFixture({
        extensionPath: 'dist-extension',
        mnemonic:
            process.env.WALLET_MNEMONIC ||
            'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        appUrl: process.env.DAPP_URL || 'https://allure-test-runner.vercel.app/e2e ',
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

async function runConnectTest({ wallet, app, widget }: { wallet: any; app: any; widget: any }, testInfo: any) {
    // Извлекаем allureId из названия теста
    const allureId = extractAllureId(testInfo.title);

    // Устанавливаем Allure аннотации
    if (allureId) {
        await allure.allureId(allureId);
        await allure.owner('e.kurilenko');
    }

    // Инициализируем переменные для данных тест-кейса
    let precondition: string = '';
    let expectedResult: string = '';
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

    await app.locator('#connectPrecondition').fill(precondition);
    await app.locator('#connectExpectedResult').fill(expectedResult);
    await wallet.connect();

    await app.getByText('✅ Validation Passed').waitFor({ state: 'visible' });
}

test('Connect @allureId(1933)', async ({ wallet, app, widget }) => {
    await runConnectTest({ wallet, app, widget }, test.info());
});
