/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

/**
 * Parsing helpers for TON-specific payloads.
 */

export function resolveTonConnectUrl(input: unknown): string | null {
    console.log('[walletkitBridge] resolveTonConnectUrl called with input type:', typeof input);
    if (input == null) {
        console.log('[walletkitBridge] input is null/undefined');
        return null;
    }

    if (typeof input === 'string') {
        const trimmed = input.trim();
        console.log('[walletkitBridge] input is string, trimmed:', trimmed.substring(0, 100));
        if (!trimmed) {
            return null;
        }
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed) as unknown;
                return resolveTonConnectUrl(parsed);
            } catch {
                return null;
            }
        }
        return trimmed;
    }

    if (Array.isArray(input)) {
        console.log('[walletkitBridge] input is array, length:', input.length);
        for (const item of input) {
            const resolved = resolveTonConnectUrl(item);
            if (resolved) {
                return resolved;
            }
        }
        return null;
    }

    if (typeof input === 'object') {
        console.log('[walletkitBridge] input is object, keys:', Object.keys(input));
        const record = input as Record<string, unknown>;
        const candidates = [
            record.url,
            record.href,
            record.link,
            record.location,
            record.requestUrl,
            record.tonconnectUrl,
            record.value,
        ];
        for (const candidate of candidates) {
            if (typeof candidate === 'string') {
                const trimmed = candidate.trim();
                if (trimmed) {
                    console.log('[walletkitBridge] found candidate URL:', trimmed.substring(0, 100));
                    return trimmed;
                }
            }
        }

        const nestedSources = [record.params, record.payload, record.data, record.body];
        for (const source of nestedSources) {
            const resolved = resolveTonConnectUrl(source);
            if (resolved) {
                return resolved;
            }
        }
    }

    console.log('[walletkitBridge] no URL found in input');
    return null;
}

export interface CellModule {
    fromBase64(value: string): {
        beginParse(): {
            loadUint(bits: number): number;
            loadStringTail(): string;
        };
    };
}

/**
 * Attempts to extract a human-readable comment from an encoded message body.
 */
export function extractTextComment(messageBody: string | null, cell?: CellModule): string | null {
    if (!messageBody || !cell) {
        return null;
    }
    try {
        const parsedCell = cell.fromBase64(messageBody);
        const slice = parsedCell.beginParse();
        const opcode = slice.loadUint(32);
        if (opcode === 0) {
            return slice.loadStringTail();
        }
        return null;
    } catch {
        return null;
    }
}
