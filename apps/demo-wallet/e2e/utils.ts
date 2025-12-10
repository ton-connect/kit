/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createComponentLogger } from '../src/utils/logger';

const log = createComponentLogger('Allure');

interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

interface AllureConfig {
    baseUrl: string;
    apiToken: string;
    projectId: number;
}

/**
 * Получает JWT токен для Allure TestOps API
 * @param config - Конфигурация Allure TestOps
 * @returns Promise с JWT токеном
 */
export async function getAllureToken(config: AllureConfig): Promise<string> {
    const { baseUrl, apiToken } = config;

    const formData = new FormData();
    formData.append('grant_type', 'apitoken');
    formData.append('scope', 'openid');
    formData.append('token', apiToken);

    try {
        const response = await fetch(`${baseUrl}/api/uaa/oauth/token`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
        }

        const tokenData: TokenResponse = await response.json();
        return tokenData.access_token;
    } catch (error) {
        throw new Error(`Error getting Allure token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
export type TestCaseData = {
    precondition: string;
    expectedResult: string;
    isPositiveCase: boolean;
};

/**
 * Создает конфигурацию Allure TestOps из переменных окружения
 * @returns Конфигурация Allure TestOps
 */
export function createAllureConfig(): AllureConfig {
    const baseUrl = process.env.ALLURE_BASE_URL || 'https://tontech.testops.cloud';
    const apiToken = process.env.ALLURE_API_TOKEN;
    const projectId = parseInt(process.env.ALLURE_PROJECT_ID || '100');
    if (!apiToken) {
        throw new Error('ALLURE_API_TOKEN environment variable is required');
    }

    return {
        baseUrl,
        apiToken,
        projectId,
    };
}

/**
 * Утилита для работы с Allure TestOps API
 */
export class AllureApiClient {
    private config: AllureConfig;
    private token?: string;
    private tokenExpiry?: number;

    constructor(config: AllureConfig) {
        this.config = config;
    }

    /**
     * Получает актуальный токен (с кэшированием)
     */
    private async getValidToken(): Promise<string> {
        const now = Date.now();

        if (!this.token || !this.tokenExpiry || now >= this.tokenExpiry) {
            this.token = await getAllureToken(this.config);
            // Токен действует 1 час, обновляем за 5 минут до истечения
            this.tokenExpiry = now + 55 * 60 * 1000;
        }

        return this.token;
    }

    /**
     * Выполняет авторизованный запрос к Allure API
     */
    private async makeRequest(endpoint: string, options: { headers?: Record<string, string> } = {}): Promise<Response> {
        const token = await this.getValidToken();

        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return response;
    }

    /**
     * Получает информацию о тест-кейсе по allureId
     */
    async getTestCase(allureId: string): Promise<unknown> {
        const response = await this.makeRequest(`/api/rs/testcase/allureId/${allureId}`);
        return await response.json();
    }

    /**
     * Получает информацию о проекте
     */
    async getProject(): Promise<unknown> {
        const response = await this.makeRequest(`/api/rs/project/${this.config.projectId}`);
        return await response.json();
    }

    /**
     * Получает список тест-планов
     */
    async getTestPlans(): Promise<unknown> {
        const response = await this.makeRequest(`/api/rs/project/${this.config.projectId}/testplan`);
        return await response.json();
    }

    /**
     * Получает информацию о тест-кейсе по ID
     * @param id - ID тест-кейса
     * @returns Promise с данными тест-кейса
     */
    async getTestCaseById(id: string): Promise<unknown> {
        const response = await this.makeRequest(`/api/testcase/${id}`);
        return await response.json();
    }

    /**
     * Получает информацию о нескольких тест-кейсах параллельно
     * @param ids - массив ID тест-кейсов
     * @returns Promise с объектом, где ключ - ID, значение - данные тест-кейса
     */
    async getTestCasesByIdBatch(ids: string[]): Promise<Record<string, unknown>> {
        log.info(`Fetching ${ids.length} test cases in parallel...`);
        const startTime = Date.now();

        const promises = ids.map(async (id) => {
            try {
                const data = await this.getTestCaseById(id);
                return { id, data };
            } catch (error) {
                log.error(`Error fetching test case ${id}:`, error);
                return { id, data: null };
            }
        });

        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;
        log.info(`Fetched ${ids.length} test cases in ${duration}ms`);

        return results.reduce(
            (acc, { id, data }) => {
                if (data) {
                    acc[id] = data;
                }
                return acc;
            },
            {} as Record<string, unknown>,
        );
    }
}

/**
 * Глобальный кэш для хранения данных тест-кейсов
 */
const testCasesCache: Record<string, TestCaseData> = {};

/**
 * Извлекает allureId из названия теста
 * @param testTitle - название теста
 * @returns allureId или null если не найден
 */
export function extractAllureId(testTitle: string): string | null {
    const match = testTitle.match(/@allureId\((\d+)\)/);
    return match ? match[1] : null;
}

/**
 * Устанавливает данные тест-кейса в кэш
 * @param allureId - ID тест-кейса
 * @param data - данные тест-кейса
 */
export function setTestCaseCache(allureId: string, data: TestCaseData): void {
    testCasesCache[allureId] = data;
}

/**
 * Получает данные тест-кейса из кэша
 * @param allureId - ID тест-кейса
 * @returns данные тест-кейса или undefined
 */
export function getTestCaseCache(allureId: string): TestCaseData | undefined {
    return testCasesCache[allureId];
}

/**
 * Предварительная загрузка тест-кейсов в кэш
 * @param allureClient - клиент Allure API
 * @param allureIds - массив ID тест-кейсов
 */
export async function preloadTestCases(allureClient: AllureApiClient, allureIds: string[]): Promise<void> {
    if (allureIds.length === 0) {
        return;
    }

    try {
        const testCasesData = await allureClient.getTestCasesByIdBatch(allureIds);

        for (const [id, rawData] of Object.entries(testCasesData)) {
            if (typeof rawData !== 'object' || rawData === null || !('name' in rawData)) {
                log.warn(`Invalid test case data for ID ${id}`);
                continue;
            }

            const testCaseName = String(rawData.name);
            const isPositiveCase = !testCaseName.toLowerCase().includes('error');

            const testCaseData: TestCaseData = {
                ...(rawData as { precondition: string; expectedResult: string }),
                isPositiveCase,
                name: testCaseName,
            };

            setTestCaseCache(id, testCaseData);
        }

        log.info(`Preloaded ${Object.keys(testCasesData).length} test cases into cache`);
    } catch (error) {
        log.warn('Failed to preload test cases in batch, tests will fetch data individually:', error);
        // Fallback: tests will fetch data individually as needed
    }
}

/**
 * Получает данные тест-кейса и извлекает precondition и expectedResult
 * Сначала проверяет кэш, затем делает запрос к API если данных нет в кэше
 * @param allureClient - клиент Allure API
 * @param allureId - ID тест-кейса
 * @returns Promise с объектом содержащим preconditions и expectedResult
 */
export async function getTestCaseData(
    allureClient: AllureApiClient,
    allureId: string,
): Promise<{
    precondition: string;
    expectedResult: string;
    isPositiveCase: boolean;
    name?: string;
}> {
    // Проверяем кэш
    const cachedData = getTestCaseCache(allureId);
    if (cachedData) {
        return cachedData;
    }

    // Если нет в кэше, делаем запрос
    try {
        const testCaseData = await allureClient.getTestCaseById(allureId);
        if (typeof testCaseData !== 'object' || testCaseData === null || !('name' in testCaseData)) {
            throw new Error('Test case data is not an object');
        }
        const testCaseName = String(testCaseData.name);
        const isPositiveCase = !testCaseName.toLowerCase().includes('error');
        const result = {
            ...testCaseData,
            isPositiveCase,
            name: testCaseName,
        } as unknown as {
            precondition: string;
            expectedResult: string;
            isPositiveCase: boolean;
            name?: string;
        };

        // Сохраняем в кэш для последующего использования
        setTestCaseCache(allureId, result);

        return result;
    } catch (error) {
        log.error('Error getting test case data:', error);
        throw error;
    }
}
