/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync as nodeReadFileSync, writeFileSync as nodeWriteFileSync } from 'node:fs';
import type { Mode, PathOrFileDescriptor } from 'node:fs';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Protected-file encoding: obfuscates secret material on disk so that it is
 * not exposed by casual text reads, grep, or accidental log output.
 *
 * **Important:** The encryption key is stored alongside the ciphertext in the
 * same file. This is intentional — the goal is to prevent *accidental*
 * plaintext leakage, not to guard against an attacker with filesystem read
 * access. Actual access control relies on POSIX file permissions (0600).
 *
 * For stronger guarantees, use an OS keychain, HSM, or external KMS.
 */

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const PROTECTED_FILE_MAGIC = Buffer.from([0x8a, 0x54, 0x4d, 0x01]);
const ENCRYPTION_KEY_BYTES = 32;
const ENCRYPTION_IV_BYTES = 12;
const ENCRYPTION_TAG_BYTES = 16;

type ProtectedFileWriteOptions = {
    mode?: Mode;
    flag?: string;
};

const HEADER_LENGTH = PROTECTED_FILE_MAGIC.length + ENCRYPTION_KEY_BYTES + ENCRYPTION_IV_BYTES + ENCRYPTION_TAG_BYTES;

function encodeProtectedText(value: string): Buffer {
    const key = randomBytes(ENCRYPTION_KEY_BYTES);
    const iv = randomBytes(ENCRYPTION_IV_BYTES);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf-8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([PROTECTED_FILE_MAGIC, key, iv, authTag, encrypted]);
}

function decodeProtectedText(value: Buffer): string {
    if (
        value.length < PROTECTED_FILE_MAGIC.length ||
        !value.subarray(0, PROTECTED_FILE_MAGIC.length).equals(PROTECTED_FILE_MAGIC)
    ) {
        return value.toString('utf-8');
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

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf-8');
}

export function readFileSync(path: PathOrFileDescriptor): string {
    const raw = nodeReadFileSync(path);
    return decodeProtectedText(raw);
}

export function writeFileSync(path: PathOrFileDescriptor, data: string, options?: ProtectedFileWriteOptions): void {
    const protectedData = encodeProtectedText(data);
    nodeWriteFileSync(path, protectedData, {
        ...(options?.mode !== undefined ? { mode: options.mode } : {}),
        ...(options?.flag ? { flag: options.flag } : {}),
    });
}
