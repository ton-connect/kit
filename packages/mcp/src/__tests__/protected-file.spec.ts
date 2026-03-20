/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { mkdtempSync, readFileSync as rawReadFileSync, rmSync, writeFileSync as rawWriteFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readFileSync, writeFileSync } from '../registry/protected-file.js';

describe('protected file wrapper', () => {
    let tempDir = '';
    let filePath = '';

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'ton-mcp-protected-file-'));
        filePath = join(tempDir, 'secret.txt');
    });

    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });

    it('writes protected content while reading back the original plaintext', () => {
        writeFileSync(filePath, 'super secret value\n');

        expect(readFileSync(filePath)).toBe('super secret value\n');
        expect(rawReadFileSync(filePath)).not.toEqual(Buffer.from('super secret value\n', 'utf-8'));
    });

    it('supports legacy plaintext files without migration', () => {
        rawWriteFileSync(filePath, 'legacy plaintext\n', 'utf-8');

        expect(readFileSync(filePath)).toBe('legacy plaintext\n');
    });
});
