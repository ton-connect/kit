import { expect } from '@playwright/test';
import { testWith } from './qa';
import { demoWalletFixture } from './demo-wallet';
import { AllureApiClient, createAllureConfig, getTestCaseData } from './utils';
import { allure } from 'allure-playwright';

const test = testWith(
    demoWalletFixture({
        extensionPath: 'dist-extension',
        mnemonic: process.env.WALLET_MNEMONIC!,
        appUrl: 'http://localhost:5174/e2e',
    }, 500),
);
const { expect } = test;

test('Sign Data', async ({ wallet, app, widget }) => {
    await expect(widget.connectButtonText).toHaveText('Connect Wallet');
    await wallet.connectBy(await widget.connectUrl());
    await expect(widget.connectButtonText).toHaveText('UQC8…t2Iv');
    await app.getByRole('button', { name: 'Sign Data' }).click();
    await wallet.signData();
    const signDataResultSelector = app.locator('.sign-data-result');
    await expect(signDataResultSelector).toHaveText('✅ TEXT Verification Result');
});