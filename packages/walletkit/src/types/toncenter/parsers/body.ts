/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Common helpers for extracting decoded body and operation types from messages
 */

import { EmulationMessage } from '../emulation';

type Json = Record<string, unknown>;

export function getDecoded(msg?: EmulationMessage | null): Json | null {
    if (!msg) return null;
    const mc = msg.message_content as unknown;
    if (isRecord(mc)) {
        const d = (mc as Json).decoded as unknown;
        return isRecord(d) ? (d as Json) : null;
    }
    return null;
}

export function extractOpFromBody(msg?: EmulationMessage | null): string | null {
    if (!msg) return null;
    const decoded = getDecoded(msg);
    if (isRecord(decoded)) {
        const t = decoded['@type'];
        if (typeof t === 'string' && t.length > 0) return t;
        const val = decoded['value'];
        if (isRecord(val) && typeof val['@type'] === 'string') return val['@type'] as string;
    }
    return null;
}

export function matchOpWithMap(op: string, types: string[], mapping: Record<string, string>): string | '' {
    if (!op) return '';
    const normalized = mapping[op] ?? op;
    return types.includes(normalized) ? normalized : '';
}

function isRecord(v: unknown): v is Json {
    return typeof v === 'object' && v !== null;
}
