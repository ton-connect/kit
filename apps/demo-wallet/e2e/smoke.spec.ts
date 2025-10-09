//import * as allure from 'allure-js-commons';
import { allure } from 'allure-playwright';

import { testWithDemoWalletFixture } from './demo-wallet';

const feature = {
    jsBridge: Boolean(process.env.E2E_JS_BRIDGE),
};
const test = testWithDemoWalletFixture({
    appUrl: process.env.DAPP_URL ?? 'https://allure-test-runner.vercel.app/e2e',
});
const { expect } = test;

test('smoke', async ({ wallet, app, widget }) => {
    await allure.story('Smoke Text');
    await allure.tags('kit', 'wallet');

    await expect(widget.connectButtonText).toHaveText('Connect Wallet');
    if (feature.jsBridge && wallet.isExtension) {
        await allure.feature('Connect JS Bridge');
        await widget.connectWallet('Tonkeeper');
        await wallet.connect();
    } else {
        await allure.feature('Connect HTTP Bridge');
        await wallet.connectBy(await widget.connectUrl());
    }
    await expect(widget.connectButtonText).not.toHaveText('Connect Wallet');

    await allure.feature('Send transaction');
    await app.getByTestId('sendTxPrecondition').fill(
        JSON.stringify({
            messages: [
                {
                    address: 'UQC8G3SPXSa3TYV3mP9N1CUqK3nPUbIyrkG-HxnozZVHt2Iv',
                    amount: '1',
                    payload: 'te6ccgEBAQEAAgAAAA==',
                },
            ],
        }),
    );
    await app.getByTestId('sendTxExpectedResult').fill('{"id": isValidSendTransactionId}');
    await app.getByTestId('send-transaction-button').click();
    await wallet.accept();
    const sendResult = await app.getByTestId('sendTransactionValidation');
    await expect(sendResult).toHaveText('Validation Passed');

    await allure.feature('Sign Data');
    await app.getByTestId('sign-data-button').click();
    await wallet.signData();
    const signResult = await app.getByTestId('signDataValidation');
    await expect(signResult).toHaveText('Validation Passed');

    await allure.feature('Disconnect');
    await widget.disconnect();
    await expect(widget.connectButtonText).toHaveText('Connect Wallet');
});
