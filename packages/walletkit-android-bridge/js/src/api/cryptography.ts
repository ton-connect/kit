/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Cryptographic helpers backed by WalletKit and custom signer coordination.
 *
 * Note: Array.from() conversions for Uint8Array → number[] are necessary glue code.
 * JSON.stringify cannot serialize Uint8Array, so we must convert to number arrays
 * for RPC communication between JS and Kotlin layers.
 */
import type { MnemonicToKeyPairArgs, SignArgs, CreateTonMnemonicArgs } from '../types';
import { CreateTonMnemonic, MnemonicToKeyPair, DefaultSignature } from '../core/moduleLoader';
import { callBridge } from '../utils/bridgeWrapper';
import type { Hex } from '@ton/walletkit';

/**
 * Signs data using a custom signer stored in Kotlin.
 * This is called by custom signer wrappers created in createAdapter.
 */
export async function signWithCustomSigner(signerId: string, bytes: Uint8Array): Promise<Hex> {
    const result = await callBridge('signWithCustomSigner', async () => {
        // Call back to Kotlin's SignerManager
        return window.WalletKitNative?.signWithCustomSigner?.(signerId, Array.from(bytes));
    });
    return result as Hex;
}

/**
 * Converts a mnemonic phrase to a key pair (public + secret keys).
 * Returns raw keyPair object - Kotlin handles Uint8Array to ByteArray conversion.
 *
 * @param args - Mnemonic words and optional type ('ton' or 'bip39').
 */
export async function mnemonicToKeyPair(args: MnemonicToKeyPairArgs) {
    return callBridge('mnemonicToKeyPair', async () => {
        return await MnemonicToKeyPair!(args.mnemonic, args.mnemonicType ?? 'ton');
    });
}

/**
 * Signs arbitrary data using a secret key.
 * Returns signature hex string directly.
 *
 * @param args - Data bytes and secret key bytes.
 */
export async function sign(args: SignArgs) {
    return callBridge('sign', async () => {
        if (!Array.isArray(args.data)) {
            throw new Error('Data array required for sign');
        }
        if (!Array.isArray(args.secretKey)) {
            throw new Error('Secret key array required for sign');
        }

        const dataBytes = Uint8Array.from(args.data);
        const secretKeyBytes = Uint8Array.from(args.secretKey);

        return DefaultSignature!(dataBytes, secretKeyBytes);
    });
}

/**
 * Generates a TON mnemonic phrase.
 * Returns array of words directly.
 *
 * @param _args - Optional generation parameters.
 */
export async function createTonMnemonic(_args: CreateTonMnemonicArgs = { count: 24 }) {
    return callBridge('createTonMnemonic', async () => {
        const mnemonicResult = await CreateTonMnemonic!();
        return Array.isArray(mnemonicResult) ? mnemonicResult : `${mnemonicResult}`.split(' ').filter(Boolean);
    });
}
