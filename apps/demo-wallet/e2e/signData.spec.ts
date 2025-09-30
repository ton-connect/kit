import { testWith } from './qa';
import { demoWalletFixture } from './demo-wallet';

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
<<<<<<< HEAD
    await expect(widget.connectButtonText).not.toHaveText('Connect Wallet');
    await app.getByRole('button', { name: 'Sign Text' }).click();
=======
    await expect(widget.connectButtonText).toHaveText('UQC8…t2Iv');
    await app.getByRole('button', { name: 'Sign Data' }).click();
>>>>>>> 1d4904d (Add sendTransaction autotests (TONTECH-658))
    await wallet.signData();
    const signDataResultSelector = app.locator('.sign-data-result');
    await expect(signDataResultSelector).toHaveText('✅ TEXT Verification Result');
});

// test('Reject Sign Data', async ({ wallet, app, widget }) => {
//     await expect(widget.connectButtonText).toHaveText('Connect Wallet');
//     await wallet.connectBy(await widget.connectUrl());
//     await expect(widget.connectButtonText).toHaveText('UQC8…t2Iv');
//     await app.getByRole('button', { name: 'Sign Text' }).click();
//     await wallet.signData(false);
//     const signDataResultSelector = app.locator('.sign-data-result');
//     await expect(signDataResultSelector).toHaveText('✅ TEXT Verification Result');
// });