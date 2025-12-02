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
    projectId: number;
}

/**
 * Получает JWT токен для Allure TestOps API
 * @param config - Конфигурация Allure TestOps
 * @returns Promise с JWT токеном
 */

export type TestCaseData = {
    precondition: string;
    expectedResult: string;
    isPositiveCase: boolean;
};
/**
 * Получает информацию о тест-кейсе по allureId
 * @param config - Конфигурация Allure TestOps
 * @param allureId - ID тест-кейса в Allure
 * @returns Promise с данными тест-кейса
 */
export async function getTestCaseByAllureId(config: AllureConfig, allureId: string): Promise<TestCaseData> {
    const { baseUrl } = config;

    try {
        const response = await fetch(`${baseUrl}/api/rs/testcase/allureId/${allureId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get test case: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        throw new Error(`Error getting test case: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Создает конфигурацию Allure TestOps из переменных окружения
 * @returns Конфигурация Allure TestOps
 */
export function createAllureConfig(): AllureConfig {
    const baseUrl = process.env.ALLURE_BASE_URL || 'https://ton-connect-test-runner.tapps.ninja/api/v1/allure-proxy';
    const projectId = parseInt(process.env.ALLURE_PROJECT_ID || '100');
    return {
        baseUrl,
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
     * Выполняет авторизованный запрос к Allure API
     */
    private async makeRequest(endpoint: string, options: { headers?: Record<string, string> } = {}): Promise<Response> {

        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            console.error(response);
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
}

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
 * Получает данные тест-кейса и извлекает precondition и expectedResult
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
}> {
    try {
        const testCaseData = await allureClient.getTestCaseById(allureId);
        if (typeof testCaseData !== 'object' || testCaseData === null || !('name' in testCaseData)) {
            throw new Error('Test case data is not an object');
        }
        const isPositiveCase = !String(testCaseData.name).toLowerCase().includes('error');
        return {
            isPositiveCase,
            ...testCaseData,
        } as unknown as {
            precondition: string;
            expectedResult: string;
            isPositiveCase: boolean;
        };
    } catch (error) {
        log.error('Error getting test case data:', error);
        // Возвращаем дефолтные значения, чтобы тесты могли выполняться без ALLURE_API_TOKEN
        return {
            precondition: '',
            expectedResult: '',
            isPositiveCase: true,
        };
    }
}
