/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface TonConfig {
    mnemonic?: string;
    private_key?: string;
    network?: 'mainnet' | 'testnet';
    wallet_version?: 'v5r1' | 'v4r2';
    toncenter_api_key?: string;
}

export interface ResolvedCredentials {
    mnemonic?: string;
    privateKey?: string;
    network: 'mainnet' | 'testnet';
    walletVersion: 'v5r1' | 'v4r2';
    toncenterApiKey?: string;
}

const CONFIG_DIR = join(homedir(), '.config', 'ton');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function getConfigPath(): string {
    return CONFIG_FILE;
}

export function loadConfig(): TonConfig | null {
    try {
        if (!existsSync(CONFIG_FILE)) return null;
        const raw = readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(raw) as TonConfig;
    } catch {
        return null;
    }
}

export function saveConfig(config: TonConfig): void {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export function deleteConfig(): boolean {
    try {
        if (existsSync(CONFIG_FILE)) {
            unlinkSync(CONFIG_FILE);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

export function configExists(): boolean {
    return existsSync(CONFIG_FILE);
}

/**
 * 3-tier credential resolution: CLI flags > env vars > config file
 */
export function resolveCredentials(flags: {
    mnemonic?: string;
    privateKey?: string;
    network?: string;
    walletVersion?: string;
    toncenterApiKey?: string;
}): ResolvedCredentials {
    const config = loadConfig();

    const mnemonic = flags.mnemonic || process.env.MNEMONIC || config?.mnemonic || undefined;
    const privateKey = flags.privateKey || process.env.PRIVATE_KEY || config?.private_key || undefined;

    const networkRaw = flags.network || process.env.NETWORK || config?.network || 'mainnet';
    const network = networkRaw === 'testnet' ? 'testnet' : 'mainnet';

    const walletVersionRaw = flags.walletVersion || process.env.WALLET_VERSION || config?.wallet_version || 'v5r1';
    const walletVersion = walletVersionRaw === 'v4r2' ? 'v4r2' : 'v5r1';

    const toncenterApiKey =
        flags.toncenterApiKey || process.env.TONCENTER_API_KEY || config?.toncenter_api_key || undefined;

    return { mnemonic, privateKey, network, walletVersion, toncenterApiKey };
}
