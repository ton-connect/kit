import { testWith } from './qa';
import { demoWalletFixture } from './demo-wallet';

const test = testWith(
    demoWalletFixture({
        extensionPath: 'dist-extension',
        mnemonic: process.env.WALLET_MNEMONIC!,
        appUrl: 'https://tonconnect-demo-dapp-with-react-ui.vercel.app/',
    }),
);
const { expect } = test;

test('Sign Data', async ({ wallet, app, widget }) => {
    await expect(widget.connectButtonText).toHaveText('Connect Wallet');
    await wallet.connectBy(await widget.connectUrl());
    await expect(widget.connectButtonText).not.toHaveText('Connect Wallet');
    await app.getByRole('button', { name: 'Sign Text' }).click();
    await wallet.signData();
    const signDataResultSelector = app.locator(
        '.sign-data-tester > div:nth-child(6) > div.find-transaction-demo__json-label',
    );
    await expect(signDataResultSelector).toHaveText('✅ Verification Result');
});
