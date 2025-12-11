/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

import { execSync } from 'child_process';
import { resolve } from 'path';

import { config } from 'dotenv';

import { config as testsConfig, type TestConfig } from './config';
import { AllureApiClient, createAllureConfig, getTestCaseData } from './allure';
import { escapeShellArg } from './utils';

// Load .env from .maestro folder
config({ path: resolve(__dirname, '.env') });

async function runTest(
    testConfig: TestConfig,
    allureClient: AllureApiClient | null,
    baseEnvVars: string,
): Promise<boolean> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${testConfig.name}${testConfig.allureId ? ` (allureId: ${testConfig.allureId})` : ''}`);
    console.log('='.repeat(60));

    let envVars = baseEnvVars;

    // Only fetch Allure data if allureId is provided
    if (testConfig.allureId && allureClient) {
        try {
            const testData = await getTestCaseData(allureClient, testConfig.allureId);

            const precondition = escapeShellArg(testData.precondition);
            const expectedResult = escapeShellArg(testData.expectedResult);

            envVars += ` -e ALLURE_ID=${testConfig.allureId} -e PRECONDITION=${precondition} -e EXPECTED_RESULT=${expectedResult}`;
        } catch (error) {
            console.error(`Failed to fetch Allure data for ${testConfig.name}:`, error);
            return false;
        }
    }

    const command = `maestro test ${envVars} ${testConfig.file}`;

    try {
        execSync(command, { stdio: 'inherit', cwd: __dirname });
        console.log(`✅ ${testConfig.name} - PASSED`);
        return true;
    } catch {
        console.error(`❌ ${testConfig.name} - FAILED`);
        return false;
    }
}

async function main() {
    const filterName = process.argv[2];

    // Environment variables from .env
    const password = process.env.PASSWORD || '1111';
    const mnemonic = process.env.MNEMONIC || '';
    const dappUrl = process.env.DAPP_URL || 'https://allure-test-runner.vercel.app/e2e';

    let baseEnvVars = `-e PASSWORD=${escapeShellArg(password)} -e DAPP_URL=${escapeShellArg(dappUrl)}`;

    if (mnemonic) {
        baseEnvVars += ` -e MNEMONIC=${escapeShellArg(mnemonic)}`;
    }

    // Load tests config first to check if we need Allure
    let testsToRun = testsConfig.tests;

    // Filter tests if name provided
    if (filterName) {
        testsToRun = testsToRun.filter(
            (t) => t.name.toLowerCase().includes(filterName.toLowerCase()) || t.allureId === filterName,
        );

        if (testsToRun.length === 0) {
            console.error(`No tests found matching: ${filterName}`);
            process.exit(1);
        }
    }

    // Check if any test requires Allure
    const needsAllure = testsToRun.some((t) => t.allureId);

    // Create Allure client only if needed
    let allureClient: AllureApiClient | null = null;
    if (needsAllure) {
        try {
            const allureConfig = createAllureConfig();
            allureClient = new AllureApiClient(allureConfig);
        } catch (error) {
            console.error('Failed to create Allure client:', error);
            process.exit(1);
        }
    }

    console.log(`Running ${testsToRun.length} test(s)...`);

    const results: { name: string; passed: boolean }[] = [];

    for (const testConfig of testsToRun) {
        const passed = await runTest(testConfig, allureClient, baseEnvVars);
        results.push({ name: testConfig.name, passed });
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    for (const result of results) {
        console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
    }

    console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

    if (failed > 0) {
        process.exit(1);
    }
}

void main();
