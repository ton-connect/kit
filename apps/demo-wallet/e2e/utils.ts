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
 * Gets JWT token for Allure TestOps API
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

/**
 * Gets test case information by allureId
 */
export async function getTestCaseByAllureId(config: AllureConfig, allureId: string): Promise<unknown> {
    const { baseUrl } = config;
    const token = await getAllureToken(config);

    try {
        const response = await fetch(`${baseUrl}/api/rs/testcase/allureId/${allureId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
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
 * Creates Allure TestOps configuration from environment variables
 */
export function createAllureConfig(): AllureConfig {
    const baseUrl = process.env.ALLURE_BASE_URL || 'https://tontech.testops.cloud';
    const apiToken = process.env.ALLURE_API_TOKEN;
    const projectId = parseInt(process.env.ALLURE_PROJECT_ID || '100');
    // eslint-disable-next-line no-console
    console.log(process.env);
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
 * Utility for working with Allure TestOps API
 */
export class AllureApiClient {
    private config: AllureConfig;
    private token?: string;
    private tokenExpiry?: number;

    constructor(config: AllureConfig) {
        this.config = config;
    }

    /**
     * Gets valid token (with caching)
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
     * Makes authorized request to Allure API
     */
    private async makeRequest(endpoint: string, options: Record<string, unknown> = {}): Promise<Response> {
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
     * Gets test case information by allureId
     */
    async getTestCase(allureId: string): Promise<unknown> {
        const response = await this.makeRequest(`/api/rs/testcase/allureId/${allureId}`);
        return await response.json();
    }

    /**
     * Gets project information
     */
    async getProject(): Promise<unknown> {
        const response = await this.makeRequest(`/api/rs/project/${this.config.projectId}`);
        return await response.json();
    }

    /**
     * Gets test plans list
     */
    async getTestPlans(): Promise<unknown> {
        const response = await this.makeRequest(`/api/rs/project/${this.config.projectId}/testplan`);
        return await response.json();
    }

    /**
     * Gets test case information by ID
     */
    async getTestCaseById(id: string): Promise<unknown> {
        const response = await this.makeRequest(`/api/testcase/${id}`);
        return await response.json();
    }
}

/**
 * Extracts allureId from test title
 */
export function extractAllureId(testTitle: string): string | null {
    const match = testTitle.match(/@allureId\((\d+)\)/);
    return match ? match[1] : null;
}

/**
 * Gets test case data and extracts precondition and expectedResult
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
        const isPositiveCase = !String(testCaseData.name).toLowerCase().includes('error');

        return {
            isPositiveCase,
            ...testCaseData,
        };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error getting test case data:', error);
        throw error;
    }
}
