/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Cryptographic helpers.
 */

import { CreateTonMnemonic, MnemonicToKeyPair, DefaultSignature } from '../core/moduleLoader';

export async function mnemonicToKeyPair(args: { mnemonic: string[]; mnemonicType?: string }) {
    if (!MnemonicToKeyPair) {
        throw new Error('MnemonicToKeyPair module not loaded');
    }
    return MnemonicToKeyPair(args.mnemonic, args.mnemonicType ?? 'ton');
}

export async function sign(args: { data: number[]; secretKey: number[] }) {
    if (!DefaultSignature) {
        throw new Error('DefaultSignature module not loaded');
    }
    return DefaultSignature(Uint8Array.from(args.data), Uint8Array.from(args.secretKey));
}

export async function createTonMnemonic() {
    if (!CreateTonMnemonic) {
        throw new Error('CreateTonMnemonic module not loaded');
    }
    return CreateTonMnemonic();
}
