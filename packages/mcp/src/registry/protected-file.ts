/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync, writeFileSync } from 'node:fs';
import type { PathOrFileDescriptor, WriteFileOptions } from 'node:fs';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const PROTECTED_FILE_MAGIC = Buffer.from([0x8a, 0x54, 0x4d, 0x01]);
const ENCRYPTION_KEY_BYTES = 32;
const ENCRYPTION_IV_BYTES = 12;
const ENCRYPTION_TAG_BYTES = 16;
const HEADER_LENGTH = PROTECTED_FILE_MAGIC.length + ENCRYPTION_KEY_BYTES + ENCRYPTION_IV_BYTES + ENCRYPTION_TAG_BYTES;

type ProtectedFileReadResult = { content: string; isProtected: boolean };

function encodeProtectedText(value: string): Buffer {
    const key = randomBytes(ENCRYPTION_KEY_BYTES);
    const iv = randomBytes(ENCRYPTION_IV_BYTES);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf-8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([PROTECTED_FILE_MAGIC, key, iv, authTag, encrypted]);
}

function decodeProtectedText(value: Buffer): ProtectedFileReadResult {
    if (
        value.length < PROTECTED_FILE_MAGIC.length ||
        !value.subarray(0, PROTECTED_FILE_MAGIC.length).equals(PROTECTED_FILE_MAGIC)
    ) {
        return { content: value.toString('utf-8'), isProtected: false };
    }

    if (value.length < HEADER_LENGTH) {
        throw new Error('Invalid protected file format.');
    }

    let offset = PROTECTED_FILE_MAGIC.length;
    const key = value.subarray(offset, offset + ENCRYPTION_KEY_BYTES);
    offset += ENCRYPTION_KEY_BYTES;
    const iv = value.subarray(offset, offset + ENCRYPTION_IV_BYTES);
    offset += ENCRYPTION_IV_BYTES;
    const authTag = value.subarray(offset, offset + ENCRYPTION_TAG_BYTES);
    offset += ENCRYPTION_TAG_BYTES;
    const encrypted = value.subarray(offset);

    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return {
        content: Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf-8'),
        isProtected: true,
    };
}

export function readMaybeEncryptedFile(path: PathOrFileDescriptor): ProtectedFileReadResult {
    const raw = readFileSync(path);
    return decodeProtectedText(raw);
}

export function writeEncryptedFile(path: PathOrFileDescriptor, data: string, options?: WriteFileOptions): void {
    const protectedData = encodeProtectedText(data);
    writeFileSync(path, protectedData, options);
}
