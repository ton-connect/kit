/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fs from 'fs/promises';
import * as path from 'path';

import type { Storage } from './storage';

/**
 * File system storage for Node.js environments
 */
export class FSStorage implements Storage {
    private readonly storagePath: string;

    constructor(storagePath: string) {
        this.storagePath = storagePath;
    }

    private getFilePath(key: string): string {
        // Sanitize key to be a valid filename
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        return path.join(this.storagePath, `${sanitizedKey}.json`);
    }

    async setItem(key: string, value: string): Promise<void> {
        await fs.mkdir(this.storagePath, { recursive: true });
        await fs.writeFile(this.getFilePath(key), JSON.stringify({ value }), 'utf-8');
    }

    async getItem(key: string): Promise<string | null> {
        try {
            const content = await fs.readFile(this.getFilePath(key), 'utf-8');
            const data = JSON.parse(content);
            return data.value;
        } catch {
            return null;
        }
    }

    async removeItem(key: string): Promise<void> {
        try {
            await fs.unlink(this.getFilePath(key));
        } catch {
            // Ignore if file doesn't exist
        }
    }
}
