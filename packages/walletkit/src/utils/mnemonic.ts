import { mnemonicToWalletKey } from '@ton/crypto';

export async function MnemonicToKeyPair(
    mnemonic: string | string[],
    mnemonicType: 'ton' | 'bip39' = 'ton',
): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
    const mnemonicArray = Array.isArray(mnemonic) ? mnemonic : mnemonic.split(' ');
    if (mnemonicArray.length !== 24) {
        throw new Error('Invalid mnemonic length: expected 24 words, got ' + mnemonicArray.length);
    }

    if (mnemonicType === 'ton') {
        const key = await mnemonicToWalletKey(mnemonicArray);
        return {
            publicKey: new Uint8Array(key.publicKey),
            secretKey: new Uint8Array(key.secretKey),
        };
    }

    // TODO bip39 support

    throw new Error('Invalid mnemonic type: expected "ton" or "bip39", got ' + mnemonicType);
}
