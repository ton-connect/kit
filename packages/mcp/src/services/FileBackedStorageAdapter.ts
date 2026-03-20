/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { StorageAdapter } from '@ton/walletkit';

interface FileBackedStorageConfig {
    prefix?: string;
}

interface StorageFileShape {
    version: 1;
    entries: Record<string, string>;
}

const DEFAULT_FILE_STATE: StorageFileShape = {
    version: 1,
    entries: {},
};

export class FileBackedStorageAdapter implements StorageAdapter {
    private readonly prefix: string;
    private operationQueue: Promise<void> = Promise.resolve();

    constructor(
        private readonly filePath: string,
        config: FileBackedStorageConfig = {},
    ) {
        this.prefix = config.prefix ?? 'ton-mcp:';
    }

    async get(key: string): Promise<string | null> {
        return this.withLock(async () => {
            const state = await this.readState();
            return state.entries[this.prefix + key] ?? null;
        });
    }

    async set(key: string, value: string): Promise<void> {
        await this.withLock(async () => {
            const state = await this.readState();
            state.entries[this.prefix + key] = value;
            await this.writeState(state);
        });
    }

    async remove(key: string): Promise<void> {
        await this.withLock(async () => {
            const state = await this.readState();
            delete state.entries[this.prefix + key];
            await this.writeState(state);
        });
    }

    async clear(): Promise<void> {
        await this.withLock(async () => {
            const state = await this.readState();
            for (const key of Object.keys(state.entries)) {
                if (key.startsWith(this.prefix)) {
                    delete state.entries[key];
                }
            }
            await this.writeState(state);
        });
    }

    private async withLock<T>(fn: () => Promise<T>): Promise<T> {
        const previous = this.operationQueue;
        let release!: () => void;
        this.operationQueue = new Promise<void>((resolve) => {
            release = resolve;
        });

        await previous;
        try {
            return await fn();
        } finally {
            release();
        }
    }

    private async readState(): Promise<StorageFileShape> {
        try {
            const raw = await readFile(this.filePath, 'utf8');
            const parsed = JSON.parse(raw) as Partial<StorageFileShape>;
            return {
                version: 1,
                entries:
                    parsed && typeof parsed === 'object' && parsed.entries && typeof parsed.entries === 'object'
                        ? Object.fromEntries(
                              Object.entries(parsed.entries).filter((entry): entry is [string, string] => {
                                  return typeof entry[0] === 'string' && typeof entry[1] === 'string';
                              }),
                          )
                        : {},
            };
        } catch (error) {
            const code = (error as NodeJS.ErrnoException | undefined)?.code;
            if (code === 'ENOENT') {
                return { ...DEFAULT_FILE_STATE };
            }
            throw error;
        }
    }

    private async writeState(state: StorageFileShape): Promise<void> {
        await mkdir(dirname(this.filePath), { recursive: true, mode: 0o700 });
        await writeFile(this.filePath, JSON.stringify(state, null, 2) + '\n', {
            encoding: 'utf8',
            mode: 0o600,
        });
        await this.applyPermissions();
    }

    private async applyPermissions(): Promise<void> {
        await Promise.allSettled([chmod(dirname(this.filePath), 0o700), chmod(this.filePath, 0o600)]);
    }
}
