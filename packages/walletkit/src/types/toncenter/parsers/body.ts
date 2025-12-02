/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Common helpers for extracting decoded body and operation types from messages
 * Refactored to use centralized opcode registry and message decoder
 */

import { EmulationMessage } from '../emulation';
import { getDecodedBody, getDecodedType } from './messageDecoder';
import { resolveOpCode, MessageType, matchesDecodedType } from './opcodes';

type Json = Record<string, unknown>;

/**
 * Get decoded body from message
 * @deprecated Use getDecodedBody from messageDecoder instead
 */
export function getDecoded(msg?: EmulationMessage | null): Json | null {
    return getDecodedBody(msg);
}

/**
 * Extract operation type from message body
 * @deprecated Use getDecodedType from messageDecoder instead
 */
export function extractOpFromBody(msg?: EmulationMessage | null): string | null {
    return getDecodedType(msg);
}

/**
 * Match operation code with type mapping
 * Now uses centralized opcode registry
 */
export function matchOpWithMap(op: string, types: string[], mapping: Record<string, string>): string | '' {
    if (!op) return '';

    // First try the new resolver
    const messageType = resolveOpCode(op);
    if (messageType !== MessageType.Unknown) {
        const typeString = messageType as string;
        if (types.includes(typeString)) {
            return typeString;
        }
    }

    // Fallback to legacy mapping for backwards compatibility
    const normalized = mapping[op] ?? op;
    return types.includes(normalized) ? normalized : '';
}

/**
 * Match decoded @type with expected types
 */
export function matchDecodedType(decodedType: string, types: string[]): string | '' {
    const matched = matchesDecodedType(decodedType, types as MessageType[]);
    return matched ? (matched as string) : '';
}
