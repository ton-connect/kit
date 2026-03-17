/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface ParsedPrivateKeyInput {
    normalizedHex: string;
    seed: Buffer;
    wasCombinedKeypair: boolean;
}

export function parsePrivateKeyInput(privateKey: string): ParsedPrivateKeyInput {
    const privateKeyStripped = privateKey.replace(/^0x/i, '').trim();
    if (!/^[0-9a-fA-F]+$/.test(privateKeyStripped)) {
        throw new Error('Invalid PRIVATE_KEY: expected hex-encoded value');
    }
    if (privateKeyStripped.length !== 64 && privateKeyStripped.length !== 128) {
        throw new Error(
            `Invalid PRIVATE_KEY: expected 32-byte (64 hex chars) or 64-byte (128 hex chars) key, got ${privateKeyStripped.length} hex chars`,
        );
    }

    const privateKeyBuffer = Buffer.from(privateKeyStripped, 'hex');
    const wasCombinedKeypair = privateKeyBuffer.length === 64;
    const seed = wasCombinedKeypair ? privateKeyBuffer.subarray(0, 32) : privateKeyBuffer;

    return {
        normalizedHex: privateKeyStripped.toLowerCase(),
        seed,
        wasCombinedKeypair,
    };
}
