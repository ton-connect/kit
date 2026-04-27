/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { parseUnits } from '@ton/walletkit';

import { normalizeAddressForComparison } from '../utils/address.js';
import { TON_DECIMALS } from '../tools/types.js';
import { LimitsConfigInvalidError, limitsFileSchema, parseWindowToMs } from './types.js';
import type { AssetLimit, JettonLimit, LimitsConfigIssue, LimitsFile, NormalizedLimits, WindowedCap } from './types.js';

type RawAssetLimit = NonNullable<LimitsFile['ton']>;
type RawJettonLimit = NonNullable<LimitsFile['jettons']>[number];

const DEFAULT_LIMITS_FILE = join(homedir(), '.config', 'ton', 'limits.json');
const ENV_LIMITS_PATH = 'TON_LIMITS_PATH';

export function getLimitsPath(): string {
    return process.env[ENV_LIMITS_PATH]?.trim() || DEFAULT_LIMITS_FILE;
}

export type LoadLimitsResult =
    | { configured: false }
    | { configured: true; limits: NormalizedLimits }
    | { configured: true; error: LimitsConfigInvalidError };

function invalid(path: string, code: string, message: string): never {
    throw new LimitsConfigInvalidError([{ path, code, message }]);
}

function buildAssetLimit(raw: RawAssetLimit, decimals: number, pathPrefix: string): AssetLimit {
    const perTx = parseUnits(raw.per_tx, decimals);
    const seenWindows = new Set<number>();
    const windows: WindowedCap[] = raw.limits.map((entry, i) => {
        const windowMs = parseWindowToMs(entry.window);
        if (seenWindows.has(windowMs)) {
            invalid(
                `${pathPrefix}.limits.${i}.window`,
                'duplicate',
                `window ${windowMs}ms is configured more than once for the same asset`,
            );
        }
        seenWindows.add(windowMs);
        const max = parseUnits(entry.max, decimals);
        if (max < perTx) invalid(`${pathPrefix}.limits.${i}.max`, 'custom', 'max must be >= per_tx');
        return { windowMs, max };
    });
    return { perTx, windows };
}

function buildJettonLimit(entry: RawJettonLimit, index: number): { address: string; limit: JettonLimit } {
    const address = normalizeAddressForComparison(entry.master_address);
    if (!address) {
        invalid(
            `jettons.${index}.master_address`,
            'invalid_address',
            `master_address is not a valid TON address: ${entry.master_address}`,
        );
    }
    const built = buildAssetLimit(entry, entry.decimals, `jettons.${index}`);
    return {
        address,
        limit: {
            masterAddress: address,
            decimals: entry.decimals,
            perTx: built.perTx,
            windows: built.windows,
            ...(entry.symbol ? { symbol: entry.symbol } : {}),
        },
    };
}

function normalize(file: { ton?: RawAssetLimit; jettons?: RawJettonLimit[] }): NormalizedLimits {
    const normalized: NormalizedLimits = {};
    if (file.ton) normalized.ton = buildAssetLimit(file.ton, TON_DECIMALS, 'ton');
    if (file.jettons?.length) {
        const map = new Map<string, JettonLimit>();
        file.jettons.forEach((entry, i) => {
            const { address, limit } = buildJettonLimit(entry, i);
            if (map.has(address)) {
                invalid(
                    `jettons.${i}.master_address`,
                    'duplicate',
                    `master_address ${entry.master_address} is configured more than once`,
                );
            }
            map.set(address, limit);
        });
        normalized.jettons = map;
    }
    return normalized;
}

function configError(code: string, message: string): LoadLimitsResult {
    return { configured: true, error: new LimitsConfigInvalidError([{ path: '', code, message }]) };
}

export function loadLimits(path: string = getLimitsPath()): LoadLimitsResult {
    let raw: unknown;
    try {
        raw = JSON.parse(readFileSync(path, 'utf-8'));
    } catch (err) {
        if ((err as { code?: string })?.code === 'ENOENT') return { configured: false };
        return configError('invalid_file', err instanceof Error ? err.message : 'Failed to read limits file');
    }

    const parsed = limitsFileSchema.safeParse(raw);
    if (!parsed.success) {
        const issues: LimitsConfigIssue[] = parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            code: issue.code,
            message: issue.message,
        }));
        return { configured: true, error: new LimitsConfigInvalidError(issues) };
    }

    try {
        return { configured: true, limits: normalize(parsed.data) };
    } catch (err) {
        if (err instanceof LimitsConfigInvalidError) return { configured: true, error: err };
        return configError('invalid_value', err instanceof Error ? err.message : 'Failed to parse limit value');
    }
}
