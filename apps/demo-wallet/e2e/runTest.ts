/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { allureId, label, suite, tags } from 'allure-js-commons';
import type { TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';

import type { AllureApiClient } from './utils';
import { getTestCaseData, extractAllureId } from './utils';
import type { TestFixture } from './qa';

const isExtension = process.env.E2E_JS_BRIDGE === 'true';

function logStep(testInfo: TestInfo, message: string): void {
    const timestamp = new Date().toISOString();
    const projectName = testInfo.project?.name ?? 'unknown-project';

    // eslint-disable-next-line no-console
    console.log(`[E2E][${timestamp}][${projectName}][${testInfo.title}] ${message}`);
}

interface SendTransactionProperties {
    waitBeforeApprove?: number;
}

export async function runSendTransactionTest(
    { wallet, app, widget }: Pick<TestFixture, 'wallet' | 'app' | 'widget'>,
    testInfo: TestInfo,
    allureClient: AllureApiClient,
    properties?: SendTransactionProperties,
): Promise<void> {
    logStep(testInfo, 'start send transaction test');

    const testAllureId = extractAllureId(testInfo.title);
    const waitBeforeApprove = properties?.waitBeforeApprove || 0;

    if (testAllureId) {
        await allureId(testAllureId);
        await label('sub-suite', 'Send Transaction');
        await tags('sendTransaction', 'automated');
        await suite('JS result');
    }

    let precondition: string = '';
    let expectedResult: string = '';
    let isPositiveCase: boolean = true;
    let testCaseName: string = '';

    if (testAllureId && allureClient) {
        try {
            logStep(testInfo, `fetching test case data for allureId=${testAllureId}`);
            const testCaseData = await getTestCaseData(allureClient, testAllureId);
            precondition = testCaseData.precondition;
            expectedResult = testCaseData.expectedResult;
            isPositiveCase = testCaseData.isPositiveCase;
            testCaseName = testCaseData.name || '';
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error getting test case data:', error);
        }
    } else {
        logStep(testInfo, 'AllureId not found in test title or client not available');
    }

    logStep(testInfo, 'waiting for Connect Wallet button');
    await expect(widget.connectButtonText).toHaveText('Connect Wallet');
    if (isExtension) {
        logStep(testInfo, 'connecting wallet via extension');
        await widget.connectWallet('Tonkeeper');
        await wallet.connect(true);
    } else {
        logStep(testInfo, 'connecting wallet via web url');
        await wallet.connectBy(await widget.connectUrl());
        await expect(widget.connectButtonText).not.toHaveText('Connect Wallet');
    }

    logStep(testInfo, 'filling precondition and expected result');
    await app.getByTestId('sendTxPrecondition').fill(precondition);
    await app.getByTestId('sendTxExpectedResult').fill(expectedResult);
    logStep(testInfo, 'click send transaction button');
    await app.getByTestId('send-transaction-button').click();

    // Check for decline in test title, Allure test case name, precondition, or expectedResult
    const titleLower = testInfo.title.toLowerCase();
    const nameLower = testCaseName.toLowerCase();
    const preconditionLower = (precondition || '').toLowerCase();
    const expectedResultLower = (expectedResult || '').toLowerCase();
    const shouldDecline =
        titleLower.includes('declined') ||
        titleLower.includes('reject') ||
        nameLower.includes('declined') ||
        nameLower.includes('reject') ||
        preconditionLower.includes('declined') ||
        preconditionLower.includes('reject') ||
        expectedResultLower.includes('declined') ||
        expectedResultLower.includes('reject');
    const shouldConfirm = !shouldDecline;

    logStep(
        testInfo,
        `calling wallet.sendTransaction (isPositiveCase=${isPositiveCase}, shouldConfirm=${shouldConfirm}, waitBeforeApprove=${waitBeforeApprove})`,
    );
    await wallet.sendTransaction(isPositiveCase, shouldConfirm, waitBeforeApprove);

    logStep(testInfo, 'waiting for sendTransactionValidation = "Validation Passed"');
    await expect(app.getByTestId('sendTransactionValidation')).toHaveText('Validation Passed');
    logStep(testInfo, 'send transaction test finished successfully');
}

export async function runSignDataTest(
    { wallet, app, widget }: Pick<TestFixture, 'wallet' | 'app' | 'widget'>,
    testInfo: TestInfo,
    allureClient: AllureApiClient,
): Promise<void> {
    logStep(testInfo, 'start sign data test');

    const testAllureId = extractAllureId(testInfo.title);

    if (testAllureId) {
        await allureId(testAllureId);
        await suite('JS result');
        await label('sub-suite', 'SignData');
        await tags('automated', 'signData');
    }

    let precondition: string = '';
    let expectedResult: string = '';
    let testCaseName: string = '';

    if (testAllureId && allureClient) {
        try {
            logStep(testInfo, `fetching test case data for allureId=${testAllureId}`);
            const testCaseData = await getTestCaseData(allureClient, testAllureId);
            precondition = testCaseData.precondition;
            expectedResult = testCaseData.expectedResult;
            testCaseName = testCaseData.name || '';
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error getting test case data:', error);
        }
    } else {
        logStep(testInfo, 'AllureId not found in test title or client not available');
    }

    logStep(testInfo, 'waiting for Connect Wallet button');
    await expect(widget.connectButtonText).toHaveText('Connect Wallet');

    if (isExtension) {
        logStep(testInfo, 'connecting wallet via extension');
        await widget.connectWallet('Tonkeeper');
        await wallet.connect(true);
    } else {
        logStep(testInfo, 'connecting wallet via web url');
        await wallet.connectBy(await widget.connectUrl());
        await expect(widget.connectButtonText).not.toHaveText('Connect Wallet');
    }

    logStep(testInfo, 'filling precondition and expected result for sign data');
    await app.getByTestId('signDataPrecondition').fill(precondition || '');
    await app.getByTestId('signDataExpectedResult').fill(expectedResult || '');
    logStep(testInfo, 'click sign data button');
    await app.getByTestId('sign-data-button').click();

    // Check for decline in test title, Allure test case name, precondition, or expectedResult
    const titleLower = testInfo.title.toLowerCase();
    const nameLower = testCaseName.toLowerCase();
    const preconditionLower = (precondition || '').toLowerCase();
    const expectedResultLower = (expectedResult || '').toLowerCase();
    const shouldDecline =
        titleLower.includes('declined') ||
        titleLower.includes('reject') ||
        nameLower.includes('declined') ||
        nameLower.includes('reject') ||
        preconditionLower.includes('declined') ||
        preconditionLower.includes('reject') ||
        expectedResultLower.includes('declined') ||
        expectedResultLower.includes('reject');
    logStep(testInfo, `calling wallet.signData(shouldApprove=${!shouldDecline})`);
    await wallet.signData(!shouldDecline);

    logStep(testInfo, 'waiting for signDataValidation = "Validation Passed"');
    await expect(app.getByTestId('signDataValidation')).toHaveText('Validation Passed');
    logStep(testInfo, 'sign data test finished successfully');
}

export async function runConnectTest(
    { wallet, app, widget }: Pick<TestFixture, 'wallet' | 'app' | 'widget'>,
    testInfo: TestInfo,
    allureClient: AllureApiClient,
): Promise<void> {
    logStep(testInfo, 'start connect test');

    const testAllureId = extractAllureId(testInfo.title);

    if (testAllureId) {
        await allureId(testAllureId);
        await suite('JS result');
        await label('sub-suite', 'Connect');
        await tags('connect', 'automated');
    }

    let precondition: string = '';
    let expectedResult: string = '';
    let testCaseName: string = '';

    if (testAllureId && allureClient) {
        logStep(testInfo, `fetching test case data for allureId=${testAllureId}`);
        const testCaseData = await getTestCaseData(allureClient, testAllureId);
        precondition = testCaseData.precondition;
        expectedResult = testCaseData.expectedResult;
        testCaseName = testCaseData.name || '';
    }

    const shouldSkipConnect = testInfo.title.includes('[ERROR]');

    // Check for decline in test title, Allure test case name, precondition, or expectedResult
    const titleLower = testInfo.title.toLowerCase();
    const nameLower = testCaseName.toLowerCase();
    const preconditionLower = (precondition || '').toLowerCase();
    const expectedResultLower = (expectedResult || '').toLowerCase();
    const shouldDecline =
        titleLower.includes('declined') ||
        titleLower.includes('reject') ||
        nameLower.includes('declined') ||
        nameLower.includes('reject') ||
        preconditionLower.includes('declined') ||
        preconditionLower.includes('reject') ||
        expectedResultLower.includes('declined') ||
        expectedResultLower.includes('reject');

    logStep(testInfo, 'filling precondition and expected result for connect');
    await app.getByTestId('connectPrecondition').fill(precondition || '');
    await app.getByTestId('connectExpectedResult').fill(expectedResult || '');
    logStep(testInfo, 'waiting for connect-button = "Connect Wallet"');
    await expect(app.getByTestId('connect-button')).toHaveText('Connect Wallet');

    if (isExtension) {
        logStep(testInfo, 'connecting via extension');
        await app.getByTestId('connect-button').click();
        await widget.connectWallet('Tonkeeper', true);
        await wallet.connect(!shouldDecline, shouldSkipConnect);
    } else {
        logStep(testInfo, 'connecting via web');
        const connectUrl = await widget.connectUrl(await app.getByTestId('connect-button'));
        await wallet.connectBy(connectUrl, shouldSkipConnect, !shouldDecline);
        if (!shouldSkipConnect && !shouldDecline) {
            await expect(widget.connectButtonText).not.toHaveText('Connect Wallet');
        }
    }

    logStep(testInfo, 'waiting for connectValidation visible');
    await app.getByTestId('connectValidation').waitFor({ state: 'visible' });
    logStep(testInfo, 'waiting for connectValidation = "Validation Passed"');
    await expect(app.getByTestId('connectValidation')).toHaveText('Validation Passed', { timeout: 1 });
    logStep(testInfo, 'connect test finished successfully');
}
