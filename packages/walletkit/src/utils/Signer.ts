/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Signer utility class for creating wallet signers

import { keyPairFromSeed } from '@ton/crypto';
import type { SignatureDomain } from '@ton/core';

import { MnemonicToKeyPair } from './mnemonic';
import { createWalletSigner } from './sign';
import { Uint8ArrayToHex } from './base64';
import type { WalletSigner } from '../api/interfaces';

/**
 * Utility class for creating wallet signers from various sources
 */
export class Signer {
    /**
     * Create a signer from a mnemonic phrase
     * @param mnemonic - Mnemonic phrase as string or array of words
     * @param options - Optional configuration for mnemonic type
     * @returns Signer function with publicKey property
     */
    static async fromMnemonic(
        mnemonic: string | string[],
        options?: { type?: 'ton' | 'bip39' },
        domain?: SignatureDomain,
    ): Promise<WalletSigner> {
        const keyPair = await MnemonicToKeyPair(mnemonic, options?.type ?? 'ton');
        const signer = createWalletSigner(keyPair.secretKey, domain);

        // Attach publicKey to the signer function
        return {
            sign: signer,
            publicKey: Uint8ArrayToHex(keyPair.publicKey),
        };
    }

    /**
     * Create a signer from a private key
     * @param privateKey - Private key as hex string or Uint8Array
     * @returns Signer function with publicKey property
     */
    static async fromPrivateKey(privateKey: string | Uint8Array, domain?: SignatureDomain): Promise<WalletSigner> {
        const privateKeyBytes =
            typeof privateKey === 'string'
                ? Uint8Array.from(Buffer.from(privateKey.replace('0x', ''), 'hex'))
                : privateKey;

        const keyPair = keyPairFromSeed(Buffer.from(privateKeyBytes));
        const signer = createWalletSigner(keyPair.secretKey, domain);

        // Attach publicKey to the signer function
        return {
            sign: signer,
            publicKey: Uint8ArrayToHex(keyPair.publicKey),
        };
    }
}
