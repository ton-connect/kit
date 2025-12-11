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

import { AllureApiClient, getTestCaseData, extractAllureId } from './utils';
import type { TestFixture } from './qa';

const isExtension = process.env.E2E_JS_BRIDGE === 'true';

interface SendTransactionProperties {
    waitBeforeApprove?: number;
}

export async function runSendTransactionTest(
    { wallet, app, widget }: Pick<TestFixture, 'wallet' | 'app' | 'widget'>,
    testInfo: TestInfo,
    allureClient: AllureApiClient,
    properties?: SendTransactionProperties,
): Promise<void> {
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
        // eslint-disable-next-line no-console
        console.warn('AllureId not found in test title or client not available');
    }

    await expect(widget.connectButtonText).toHaveText('Connect Wallet');
    if (isExtension) {
        await widget.connectWallet('Tonkeeper');
        await wallet.connect(true);
    } else {
        await wallet.connectBy(await widget.connectUrl());
        await expect(widget.connectButtonText).not.toHaveText('Connect Wallet');
    }

    await app.getByTestId('sendTxPrecondition').fill(precondition);
    await app.getByTestId('sendTxExpectedResult').fill(expectedResult);
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

    await wallet.sendTransaction(isPositiveCase, shouldConfirm, waitBeforeApprove);

    await expect(app.getByTestId('sendTransactionValidation')).toHaveText('Validation Passed');
}

export async function runSignDataTest(
    { wallet, app, widget }: Pick<TestFixture, 'wallet' | 'app' | 'widget'>,
    testInfo: TestInfo,
    allureClient: AllureApiClient,
): Promise<void> {
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
            const testCaseData = await getTestCaseData(allureClient, testAllureId);
            precondition = testCaseData.precondition;
            expectedResult = testCaseData.expectedResult;
            testCaseName = testCaseData.name || '';
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error getting test case data:', error);
        }
    } else {
        // eslint-disable-next-line no-console
        console.warn('AllureId not found in test title or client not available');
    }

    await expect(widget.connectButtonText).toHaveText('Connect Wallet');

    if (isExtension) {
        await widget.connectWallet('Tonkeeper');
        await wallet.connect(true);
    } else {
        await wallet.connectBy(await widget.connectUrl());
        await expect(widget.connectButtonText).not.toHaveText('Connect Wallet');
    }

    await app.getByTestId('signDataPrecondition').fill(precondition || '');
    await app.getByTestId('signDataExpectedResult').fill(expectedResult || '');
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

    await wallet.signData(!shouldDecline);
    await expect(app.getByTestId('signDataValidation')).toHaveText('Validation Passed');
}

export async function runConnectTest(
    { wallet, app, widget }: Pick<TestFixture, 'wallet' | 'app' | 'widget'>,
    testInfo: TestInfo,
    allureClient: AllureApiClient,
): Promise<void> {
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

    await app.getByTestId('connectPrecondition').fill(precondition || '');
    await app.getByTestId('connectExpectedResult').fill(expectedResult || '');
    await expect(app.getByTestId('connect-button')).toHaveText('Connect Wallet');

    if (isExtension) {
        app.getByTestId('connect-button').click();
        widget.connectWallet('Tonkeeper', true);
        wallet.connect(!shouldDecline, shouldSkipConnect);
    } else {
        const connectUrl = await widget.connectUrl(await app.getByTestId('connect-button'));
        await wallet.connectBy(connectUrl, shouldSkipConnect, !shouldDecline);
        if (!shouldSkipConnect && !shouldDecline) {
            expect(widget.connectButtonText).not.toHaveText('Connect Wallet');
        }
    }

    await app.getByTestId('connectValidation').waitFor({ state: 'visible' });
    await expect(app.getByTestId('connectValidation')).toHaveText('Validation Passed', { timeout: 1 });
}
