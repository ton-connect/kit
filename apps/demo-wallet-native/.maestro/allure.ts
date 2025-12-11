/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

export interface AllureConfig {
    baseUrl: string;
    apiToken: string;
    projectId: number;
}

export type TestCaseData = {
    precondition: string;
    expectedResult: string;
    isPositiveCase: boolean;
};

/**
 * Получает JWT токен для Allure TestOps API
 */
async function getAllureToken(config: AllureConfig): Promise<string> {
    const { baseUrl, apiToken } = config;

    const formData = new FormData();
    formData.append('grant_type', 'apitoken');
    formData.append('scope', 'openid');
    formData.append('token', apiToken);

    const response = await fetch(`${baseUrl}/api/uaa/oauth/token`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
    }

    const tokenData: TokenResponse = await response.json();
    return tokenData.access_token;
}

/**
 * Создает конфигурацию Allure TestOps из переменных окружения
 */
export function createAllureConfig(): AllureConfig {
    const baseUrl = process.env.ALLURE_BASE_URL || 'https://tontech.testops.cloud';
    const apiToken = process.env.ALLURE_API_TOKEN;
    const projectId = parseInt(process.env.ALLURE_PROJECT_ID || '100');

    if (!apiToken) {
        throw new Error('ALLURE_API_TOKEN environment variable is required');
    }

    return { baseUrl, apiToken, projectId };
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
     * Получает информацию о тест-кейсе по ID
     */
    async getTestCaseById(id: string): Promise<unknown> {
        const response = await this.makeRequest(`/api/testcase/${id}`);
        return await response.json();
    }
}

/**
 * Получает данные тест-кейса и извлекает precondition и expectedResult
 */
export async function getTestCaseData(allureClient: AllureApiClient, allureId: string): Promise<TestCaseData> {
    const testCaseData = await allureClient.getTestCaseById(allureId);

    if (typeof testCaseData !== 'object' || testCaseData === null || !('name' in testCaseData)) {
        throw new Error('Test case data is not an object');
    }

    const data = testCaseData as { name: string; precondition?: string; expectedResult?: string };
    const isPositiveCase = !String(data.name).toLowerCase().includes('error');

    return {
        precondition: parseAllureField(data.precondition || ''),
        expectedResult: parseAllureField(data.expectedResult || ''),
        isPositiveCase,
    };
}

function parseAllureField(value: string): string {
    // Extract JSON from Markdown code block if present
    const jsonMatch = value.match(/```(?:json)?\s*([\s\S]*?)```/);

    if (jsonMatch) {
        return jsonMatch[1].trim();
    }

    return value.trim();
}
