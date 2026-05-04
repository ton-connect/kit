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
     * Source address of the message, or undefined for external inbound messages
     */
    source?: UserFriendlyAddress;

    /**
     * Destination address of the message
     */
    destination: UserFriendlyAddress;

    /**
     * Amount of nanotons transferred, or undefined for external inbound messages
     */
    value?: TokenAmount;

    /**
     * Extra currencies transferred with the message
     */
    valueExtraCurrencies: ExtraCurrencies;

    /**
     * Forwarding fee in nanotons, or undefined for external inbound messages
     */
    fwdFee?: TokenAmount;

    /**
     * IHR (Instant Hypercube Routing) fee in nanotons, or undefined for external inbound messages
     */
    ihrFee?: TokenAmount;

    /**
     * Logical time when the message was created, or undefined for external inbound messages
     */
    createdLt?: LogicalTime;

    /**
     * Unix timestamp when the message was created, or undefined for external inbound messages
     * @format timestamp
     */
    createdAt?: number;

    /**
     * Hex-encoded opcode from the message body, if present
     */
    opcode?: Hex;

    /**
     * Whether IHR delivery is disabled, or undefined for external inbound messages
     */
    ihrDisabled?: boolean;

    /**
     * Whether the message requested a bounce on failure, or undefined for external inbound messages
     */
    isBounce?: boolean;

    /**
     * Whether the message was bounced back, or undefined for external inbound messages
     */
    isBounced?: boolean;

    /**
     * Import fee paid for delivering an external inbound message, undefined for all other message types
     */
    importFee?: TokenAmount;

    /**
     * Decoded content of the message body
     */
    messageContent: EmulationMessageContent;

    /**
     * Initial state (StateInit) attached to the message, if any
     */
    initState?: unknown;
}

/**
 * Decoded content of an emulation message body.
 */
export interface EmulationMessageContent {
    /**
     * Hex-encoded hash of the message content, if available
     */
    hash?: Hex;

    /**
     * Message body in BOC base64 format, if available
     */
    body?: Base64String;

    /**
     * Structured decoded representation of the message body, if available
     */
    decoded?: unknown;
}
