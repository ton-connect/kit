/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Pattern matching based message decoder
 * Provides extensible message decoding with type-safe pattern matching
 */

import type { EmulationMessage } from '../emulation';
import { MessageType, resolveOpCode, matchesDecodedType } from './opcodes';

/**
 * Decoded message payload with type information
 */
export interface DecodedMessage<T = unknown> {
    messageType: MessageType;
    opcode?: string;
    decodedType?: string;
    payload: T;
    rawMessage: EmulationMessage;
}

/**
 * Pattern matcher for message types
 */
export interface MessagePattern<T = unknown> {
    messageType: MessageType;
    match: (msg: EmulationMessage) => boolean;
    decode: (msg: EmulationMessage) => T | null;
}

/**
 * Generic decoded payload type
 */
export type DecodedPayload = Record<string, unknown>;

/**
 * Registry of message patterns
 */
class MessagePatternRegistry {
    private patterns: Map<MessageType, MessagePattern[]> = new Map();

    /**
     * Register a pattern for a message type
     */
    register<T = unknown>(pattern: MessagePattern<T>): void {
        const existing = this.patterns.get(pattern.messageType) || [];
        existing.push(pattern as MessagePattern);
        this.patterns.set(pattern.messageType, existing);
    }

    /**
     * Find matching pattern for a message
     */
    match(msg: EmulationMessage): MessagePattern | null {
        for (const patterns of this.patterns.values()) {
            for (const pattern of patterns) {
                if (pattern.match(msg)) {
                    return pattern;
                }
            }
        }
        return null;
    }

    /**
     * Get all patterns for a message type
     */
    getPatterns(messageType: MessageType): MessagePattern[] {
        return this.patterns.get(messageType) || [];
    }
}

/**
 * Global pattern registry
 */
export const messagePatternRegistry = new MessagePatternRegistry();

/**
 * Extracts decoded body from message
 */
export function getDecodedBody(msg?: EmulationMessage | null): DecodedPayload | null {
    if (!msg) return null;
    const mc = msg.message_content as unknown;
    if (isRecord(mc)) {
        const decoded = (mc as DecodedPayload).decoded as unknown;
        return isRecord(decoded) ? (decoded as DecodedPayload) : null;
    }
    return null;
}

/**
 * Extracts @type from decoded body
 */
export function getDecodedType(msg?: EmulationMessage | null): string | null {
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

/**
 * Decodes a message using pattern matching
 */
export function decodeMessage(msg: EmulationMessage): DecodedMessage | null {
    // Try pattern matching first
    const pattern = messagePatternRegistry.match(msg);
    if (pattern) {
        const payload = pattern.decode(msg);
        if (payload !== null) {
            return {
                messageType: pattern.messageType,
                opcode: msg.opcode ?? undefined,
                decodedType: getDecodedType(msg) || undefined,
                payload,
                rawMessage: msg,
            };
        }
    }

    // Fallback: try opcode resolution
    if (msg.opcode) {
        const messageType = resolveOpCode(msg.opcode);
        if (messageType !== MessageType.Unknown) {
            return {
                messageType,
                opcode: msg.opcode ?? undefined,
                decodedType: getDecodedType(msg) || undefined,
                payload: getDecodedBody(msg) || {},
                rawMessage: msg,
            };
        }
    }

    // Fallback: try decoded type
    const decodedType = getDecodedType(msg);
    if (decodedType) {
        const matched = matchesDecodedType(decodedType, Object.values(MessageType));
        if (matched) {
            return {
                messageType: matched,
                opcode: msg.opcode ?? undefined,
                decodedType,
                payload: getDecodedBody(msg) || {},
                rawMessage: msg,
            };
        }
    }

    return null;
}

/**
 * Decodes multiple messages
 */
export function decodeMessages(messages: EmulationMessage[]): DecodedMessage[] {
    return messages.map(decodeMessage).filter((m): m is DecodedMessage => m !== null);
}

/**
 * Helper: check if value is a record
 */
function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null;
}

/**
 * Helper: extract property from decoded payload
 */
export function getPayloadProperty<T = unknown>(payload: DecodedPayload, key: string): T | undefined {
    return payload[key] as T | undefined;
}

/**
 * Helper: extract nested property from decoded payload
 */
export function getNestedProperty<T = unknown>(payload: DecodedPayload, path: string[]): T | undefined {
    let current: unknown = payload;
    for (const key of path) {
        if (!isRecord(current)) return undefined;
        current = current[key];
    }
    return current as T | undefined;
}

// Register built-in patterns

// Jetton Transfer pattern
messagePatternRegistry.register({
    messageType: MessageType.JettonTransfer,
    match: (msg) => {
        const decoded = getDecodedBody(msg);
        const type = getDecodedType(msg);
        return (
            msg.opcode === '0x0f8a7ea5' ||
            type === 'jetton_transfer' ||
            (decoded !== null && decoded['@type'] === 'jetton_transfer')
        );
    },
    decode: (msg) => getDecodedBody(msg),
});

// Jetton Internal Transfer pattern
messagePatternRegistry.register({
    messageType: MessageType.JettonInternalTransfer,
    match: (msg) => {
        const decoded = getDecodedBody(msg);
        const type = getDecodedType(msg);
        return (
            msg.opcode === '0x178d4519' ||
            type === 'jetton_internal_transfer' ||
            (decoded !== null && decoded['@type'] === 'jetton_internal_transfer')
        );
    },
    decode: (msg) => getDecodedBody(msg),
});

// Jetton Notify pattern
messagePatternRegistry.register({
    messageType: MessageType.JettonNotify,
    match: (msg) => {
        const decoded = getDecodedBody(msg);
        const type = getDecodedType(msg);
        return (
            msg.opcode === '0x7362d09c' ||
            type === 'jetton_notify' ||
            (decoded !== null && decoded['@type'] === 'jetton_notify')
        );
    },
    decode: (msg) => getDecodedBody(msg),
});

// NFT Transfer pattern
messagePatternRegistry.register({
    messageType: MessageType.NftTransfer,
    match: (msg) => {
        const decoded = getDecodedBody(msg);
        const type = getDecodedType(msg);
        return (
            msg.opcode === '0x5fcc3d14' ||
            type === 'nft_transfer' ||
            (decoded !== null && decoded['@type'] === 'nft_transfer')
        );
    },
    decode: (msg) => getDecodedBody(msg),
});

// NFT Ownership Assigned pattern
messagePatternRegistry.register({
    messageType: MessageType.NftOwnershipAssigned,
    match: (msg) => {
        const decoded = getDecodedBody(msg);
        const type = getDecodedType(msg);
        return (
            msg.opcode === '0x05138d91' ||
            type === 'nft_ownership_assigned' ||
            (decoded !== null && decoded['@type'] === 'nft_ownership_assigned')
        );
    },
    decode: (msg) => getDecodedBody(msg),
});

// NFT Owner Changed pattern
messagePatternRegistry.register({
    messageType: MessageType.NftOwnerChanged,
    match: (msg) => {
        const decoded = getDecodedBody(msg);
        const type = getDecodedType(msg);
        return (
            msg.opcode === '0x7bdd97de' ||
            type === 'nft_owner_changed' ||
            (decoded !== null && decoded['@type'] === 'nft_owner_changed')
        );
    },
    decode: (msg) => getDecodedBody(msg),
});

// Excess pattern
messagePatternRegistry.register({
    messageType: MessageType.Excess,
    match: (msg) => {
        const decoded = getDecodedBody(msg);
        const type = getDecodedType(msg);
        return msg.opcode === '0xd53276db' || type === 'excess' || (decoded !== null && decoded['@type'] === 'excess');
    },
    decode: (msg) => getDecodedBody(msg),
});
