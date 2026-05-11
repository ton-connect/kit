/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EmulationMessage } from '../emulation';
import { resolveOpCode, MessageType, matchesDecodedType } from './opcodes';

type Json = Record<string, unknown>;

function isRecord(v: unknown): v is Record<string, unknown> {
    return v !== null && typeof v === 'object';
}

function getDecodedBody(msg?: EmulationMessage | null): Json | null {
    if (!msg) return null;
    const mc = msg.message_content as unknown;
    if (isRecord(mc)) {
        const decoded = (mc as Json).decoded as unknown;
        return isRecord(decoded) ? (decoded as Json) : null;
    }
    return null;
}

function getDecodedType(msg?: EmulationMessage | null): string | null {
    const decoded = getDecodedBody(msg);
    if (decoded) {
        const type = decoded['@type'];
        if (typeof type === 'string') return type;

        const value = decoded['value'];
        if (isRecord(value) && typeof value['@type'] === 'string') {
            return value['@type'] as string;
        }
    }
    return null;
}

export function getDecoded(msg?: EmulationMessage | null): Json | null {
    return getDecodedBody(msg);
}

export function extractOpFromBody(msg?: EmulationMessage | null): string | null {
    return getDecodedType(msg);
}

export function matchOpWithMap(op: string, types: string[], mapping: Record<string, string>): string | '' {
    if (!op) return '';

    const messageType = resolveOpCode(op);
    if (messageType !== MessageType.Unknown) {
        const typeString = messageType as string;
        if (types.includes(typeString)) {
            return typeString;
        }
    }

    const normalized = mapping[op] ?? op;
    return types.includes(normalized) ? normalized : '';
}

export function matchDecodedType(decodedType: string, types: string[]): string | '' {
    const matched = matchesDecodedType(decodedType, types as MessageType[]);
    return matched ? (matched as string) : '';
}
