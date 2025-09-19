import { mnemonicToWalletKey } from '@ton/crypto';

import { WalletKitError, ERROR_CODES } from '../errors';

export async function MnemonicToKeyPair(
    mnemonic: string | string[],
    mnemonicType: 'ton' | 'bip39' = 'ton',
): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
    const mnemonicArray = Array.isArray(mnemonic) ? mnemonic : mnemonic.split(' ');
    if (mnemonicArray.length !== 24) {
        throw new WalletKitError(
            ERROR_CODES.VALIDATION_ERROR,
            `Invalid mnemonic length: expected 24 words, got ${mnemonicArray.length}`,
            undefined,
            { receivedLength: mnemonicArray.length, expectedLength: 24 },
        );
    }

    if (mnemonicType === 'ton') {
        const key = await mnemonicToWalletKey(mnemonicArray);
        return {
            publicKey: new Uint8Array(key.publicKey),
            secretKey: new Uint8Array(key.secretKey),
        };
    }

    // TODO bip39 support

    throw new WalletKitError(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid mnemonic type: expected "ton" or "bip39", got "${mnemonicType}"`,
        undefined,
        { receivedType: mnemonicType, supportedTypes: ['ton', 'bip39'] },
    );
}
