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
        'Accept': 'application/json',
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
 * Получает информацию о тест-кейсе по allureId
 * @param config - Конфигурация Allure TestOps
 * @param allureId - ID тест-кейса в Allure
 * @returns Promise с данными тест-кейса
 */
export async function getTestCaseByAllureId(config: AllureConfig, allureId: string): Promise<any> {
  const { baseUrl } = config;
  const token = await getAllureToken(config);

  try {
    const response = await fetch(`${baseUrl}/api/rs/testcase/allureId/${allureId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
      this.tokenExpiry = now + (55 * 60 * 1000);
    }

    return this.token;
  }

  /**
   * Выполняет авторизованный запрос к Allure API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getValidToken();
    
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
  async getTestCase(allureId: string): Promise<any> {
    const response = await this.makeRequest(`/api/rs/testcase/allureId/${allureId}`);
    return await response.json();
  }

  /**
   * Получает информацию о проекте
   */
  async getProject(): Promise<any> {
    const response = await this.makeRequest(`/api/rs/project/${this.config.projectId}`);
    return await response.json();
  }

  /**
   * Получает список тест-планов
   */
  async getTestPlans(): Promise<any> {
    const response = await this.makeRequest(`/api/rs/project/${this.config.projectId}/testplan`);
    return await response.json();
  }

  /**
   * Получает информацию о тест-кейсе по ID
   * @param id - ID тест-кейса
   * @returns Promise с данными тест-кейса
   */
  async getTestCaseById(id: string): Promise<any> {
    const response = await this.makeRequest(`/api/testcase/${id}`);
    return await response.json();
  }
}

/**
 * Получает данные тест-кейса и извлекает precondition и expectedResult
 * @param allureClient - клиент Allure API
 * @param allureId - ID тест-кейса
 * @returns Promise с объектом содержащим preconditions и expectedResult
 */
export async function getTestCaseData(allureClient: AllureApiClient, allureId: string): Promise<{
  preconditions: string;
  expectedResult: string;
  isPositiveCase: boolean;
  rawData: string;
}> {
  try {
    const testCaseData = await allureClient.getTestCaseById(allureId);
    
    // Функция для извлечения JSON из markdown-блока или парсинга прямого JSON
    const extractData = (text: string): string => {
      if (!text) return '';
      
      // Пытаемся найти JSON в markdown блоке
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
        } catch (error) {
          console.warn('Failed to parse JSON from markdown block:', error);
          return jsonMatch[1].trim();
        }
      }

      // Если нет markdown блока, пытаемся парсить как прямой JSON
      try {
        const parsed = JSON.parse(text.trim());
        return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
      } catch (error) {
        // Если не JSON, возвращаем как есть
        console.warn('не распарсил JSON:', error);
        return text;
      }
    };
    
    const extractedName = extractData(testCaseData.name);
    const isPositiveCase = extractedName && 
      !String(extractedName).toLowerCase().includes('error');

    const preconditions = extractData(testCaseData.precondition);
    const expectedResult = extractData(testCaseData.expectedResult);
    
    return {
      preconditions: typeof preconditions === 'string' ? preconditions : JSON.stringify(preconditions, null, 2),
      expectedResult: typeof expectedResult === 'string' ? expectedResult : JSON.stringify(expectedResult, null, 2),
      isPositiveCase,
      rawData: testCaseData
    };
    
  } catch (error) {
    console.error('Error getting test case data:', error);
    throw error;
  }
}
