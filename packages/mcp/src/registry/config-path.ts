/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { chmodSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const DEFAULT_CONFIG_FILE = join(homedir(), '.config', 'ton', 'config.json');
const ENV_CONFIG_PATH = 'TON_CONFIG_PATH';

export function getConfigPath(): string {
    return process.env[ENV_CONFIG_PATH]?.trim() || DEFAULT_CONFIG_FILE;
}

export function getConfigDir(): string {
    return dirname(getConfigPath());
}

export function chmodIfExists(path: string, mode: number): void {
    try {
        if (existsSync(path)) {
            chmodSync(path, mode);
        }
    } catch {
        // Best-effort only.
    }
}
