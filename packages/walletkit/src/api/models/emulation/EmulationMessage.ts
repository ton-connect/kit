/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress, LogicalTime, Hex, Base64String } from '../core/Primitives';
import type { TokenAmount } from '../core/TokenAmount';
import type { ExtraCurrencies } from '../core/ExtraCurrencies';

/**
 * Message sent or received within an emulated transaction trace.
 */
export interface EmulationMessage {
    /**
     * Hex-encoded hash of the message
     */
    hash: Hex;

    /**
     * Hex-encoded normalized hash used for deduplication across message variants
     */
    normalizedHash?: Hex;

    /**
     * Source address of the message, or null for external inbound messages
     */
    source: UserFriendlyAddress | null;

    /**
     * Destination address of the message
     */
    destination: UserFriendlyAddress;

    /**
     * Amount of nanotons transferred, or null for external inbound messages
     */
    value: TokenAmount | null;

    /**
     * Extra currencies transferred with the message
     */
    valueExtraCurrencies: ExtraCurrencies;

    /**
     * Forwarding fee in nanotons, or null for external inbound messages
     */
    fwdFee: TokenAmount | null;

    /**
     * IHR (Instant Hypercube Routing) fee in nanotons, or null for external inbound messages
     */
    ihrFee: TokenAmount | null;

    /**
     * Logical time when the message was created, or null for external inbound messages
     */
    createdLt: LogicalTime | null;

    /**
     * Unix timestamp when the message was created, or null for external inbound messages
     * @format timestamp
     */
    createdAt: number | null;

    /**
     * Hex-encoded opcode from the message body, if present
     */
    opcode: Hex | null;

    /**
     * Whether IHR delivery is disabled, or null for external inbound messages
     */
    ihrDisabled: boolean | null;

    /**
     * Whether the message requested a bounce on failure, or null for external inbound messages
     */
    isBounce: boolean | null;

    /**
     * Whether the message was bounced back, or null for external inbound messages
     */
    isBounced: boolean | null;

    /**
     * Import fee paid for delivering an external inbound message, null for all other message types
     */
    importFee: TokenAmount | null;

    /**
     * Decoded content of the message body
     */
    messageContent: EmulationMessageContent;

    /**
     * Initial state (StateInit) attached to the message, if any
     */
    initState: unknown | null;
}

/**
 * Decoded content of an emulation message body.
 */
export interface EmulationMessageContent {
    /**
     * Hex-encoded hash of the message content, or null if not available
     */
    hash: Hex | null;

    /**
     * Message body in BOC base64 format, or null if not available
     */
    body: Base64String | null;

    /**
     * Structured decoded representation of the message body, if available
     */
    decoded: unknown | null;
}
