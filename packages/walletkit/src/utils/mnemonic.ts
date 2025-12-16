/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { mnemonicToSeed as bip39MnemonicToSeed } from 'bip39';

import { WalletKitError, ERROR_CODES } from '../errors';
import { loadTonCrypto } from '../deps';

async function bip39ToPrivateKey(mnemonic: string[]) {
    const { deriveEd25519Path, keyPairFromSeed } = await loadTonCrypto();
    const seed = await bip39MnemonicToSeed(mnemonic.join(' '));
    const TON_DERIVATION_PATH = [44, 607, 0];
    const seedContainer = await deriveEd25519Path(seed, TON_DERIVATION_PATH);
    return keyPairFromSeed(seedContainer.subarray(0, 32));
}

/**
 * Convert a mnemonic to a key pair
 * @param mnemonic - The mnemonic to convert, can be an array of strings or a string. 12 or 24 words
 * @param mnemonicType - The type of mnemonic to convert, can be 'ton' or 'bip39'
 * @returns The key pair
 */
export async function MnemonicToKeyPair(
    mnemonic: string | string[],
    mnemonicType: 'ton' | 'bip39' = 'ton',
): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
    const mnemonicArray = Array.isArray(mnemonic) ? mnemonic : mnemonic.split(' ');

    if (mnemonicArray.length !== 12 && mnemonicArray.length !== 24) {
        throw new WalletKitError(
            ERROR_CODES.VALIDATION_ERROR,
            `Invalid mnemonic length: expected 12 or 24 words, got ${mnemonicArray.length}`,
        );
    }

    if (mnemonicType === 'ton') {
        const { mnemonicToWalletKey } = await loadTonCrypto();
        const key = await mnemonicToWalletKey(mnemonicArray);
        return {
            publicKey: new Uint8Array(key.publicKey),
            secretKey: new Uint8Array(key.secretKey),
        };
    }

    if (mnemonicType === 'bip39') {
        const key = await bip39ToPrivateKey(mnemonicArray);
        return {
            publicKey: new Uint8Array(key.publicKey),
            secretKey: new Uint8Array(key.secretKey),
        };
    }

    throw new WalletKitError(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid mnemonic type: expected "ton" or "bip39", got "${mnemonicType}"`,
        undefined,
        { receivedType: mnemonicType, supportedTypes: ['ton', 'bip39'] },
    );
}

export async function CreateTonMnemonic(): Promise<string[]> {
    const { mnemonicNew } = await loadTonCrypto();
    return mnemonicNew(24);
}
