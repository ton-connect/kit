/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ValidationResult } from './types';
import { validateTonAddress } from './address';
import { isFriendlyTonAddress } from '../utils/address';
import { loadTonCore } from '../deps/tonCore';

/**
 * Human-readable transaction message
 */
export interface HumanReadableTx {
    /** Recipient address */
    to: string;

    /** Amount in TON (formatted string) */
    valueTON: string;

    /** Optional comment/memo */
    comment?: string;

    /** Transaction type */
    type: 'ton' | 'jetton' | 'nft' | 'contract-call' | 'raw';

    /** Additional metadata */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extra?: Record<string, any>;
}

/**
 * Validate transaction messages array
 */

export async function validateTransactionMessages(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: any[],
    isTonConnect: boolean = true,
): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!Array.isArray(messages)) {
        errors.push('messages must be an array');
        return { isValid: false, errors };
    }

    if (messages.length === 0) {
        errors.push('messages array cannot be empty');
        return { isValid: false, errors };
    }

    // Validate each message
    for (let index = 0; index < messages.length; index++) {
        const msg = messages[index];
        const msgResult = await validateTransactionMessage(msg, isTonConnect);
        msgResult.errors.forEach((error) => {
            errors.push(`message[${index}]: ${error}`);
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate individual transaction message
 */

export async function validateTransactionMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: any,
    isTonConnect: boolean = true,
): Promise<ValidationResult> {
    const errors: string[] = [];

    if (typeof message !== 'object') {
        return { isValid: false, errors: ['Invalid message'] };
    }

    if (message === null || message === undefined) {
        return { isValid: false, errors: ['Invalid message'] };
    }

    if (isTonConnect && typeof message.mode !== 'undefined') {
        errors.push('mode must be undefined for tonconnect!');
    }

    // Object format - validate required fields
    const objErrors = (await validateMessageObject(message)).errors;
    errors.push(...objErrors);

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate message object structure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function validateMessageObject(message: any): Promise<ValidationResult> {
    const errors: string[] = [];

    // Required fields
    if (!message.address || typeof message.address !== 'string') {
        errors.push('to address is required and must be a string');
    } else {
        if (!(await isFriendlyTonAddress(message.address))) {
            errors.push('to address must be a valid friendly TON address');
        }
    }

    if (message.amount !== undefined) {
        if (!isValidNanotonAmount(message.amount)) {
            errors.push('value must be a valid nanonton amount (string of digits)');
        }
    } else {
        errors.push('value must be a valid nanonton amount (string of digits)');
    }

    // Optional fields validation
    if (message.payload) {
        if (typeof message.payload !== 'string') {
            errors.push('payload must be a string if provided');
        } else {
            if (!(await isValidBOC(message.payload))) {
                errors.push('payload must be a valid base64 string if provided');
            }
        }
    }

    if (message.stateInit) {
        if (typeof message.stateInit !== 'string') {
            errors.push('stateInit must be a string if provided');
        } else {
            if (!(await isValidBOC(message.stateInit))) {
                errors.push('stateInit must be a valid base64 string if provided');
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate transaction request structure
 */

export async function validateTransactionRequest(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: any,
    isTonConnect: boolean = true,
): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!request || typeof request !== 'object') {
        errors.push('transaction request must be an object');
        return { isValid: false, errors };
    }

    // Validate required fields
    const messagesValidation = await validateTransactionMessages(request.messages || [], isTonConnect);
    if (!messagesValidation.isValid) {
        errors.push(...messagesValidation.errors);
    }

    // Validate optional fields
    if (request.from) {
        const fromValidation = await validateTonAddress(request.from);
        if (!fromValidation.isValid) {
            errors.push(`invalid from address: ${fromValidation.errors.join(', ')}`);
        }
    }

    if (request.validUntil) {
        if (typeof request.validUntil !== 'number') {
            errors.push('validUntil must be a number');
        } else if (request.validUntil <= Math.floor(Date.now() / 1000)) {
            errors.push('validUntil must be a future timestamp');
        }
    }

    if (request.network && !['mainnet', 'testnet'].includes(request.network)) {
        errors.push('network must be "mainnet" or "testnet" if provided');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate BOC (Bag of Cells) format
 */
export async function validateBOC(bocString: string): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!bocString || typeof bocString !== 'string') {
        errors.push('BOC must be a non-empty string');
        return { isValid: false, errors };
    }

    if (!(await isValidBOC(bocString))) {
        errors.push('invalid BOC format - must be valid base64');
    }

    // Additional BOC-specific validations could go here
    // For example, checking magic bytes, cell structure, etc.

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Check if value is a valid nanonton amount
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isValidNanotonAmount(amount: any): boolean {
    if (typeof amount !== 'string') {
        return false;
    }

    const amountStr = String(amount);

    // Check if it's a valid non-negative integer
    const parsed = BigInt(amountStr);
    return parsed >= 0 && parsed.toString() === amountStr;
}

/**
 * Check if string is valid BOC format
 */
async function isValidBOC(bocString: string): Promise<boolean> {
    try {
        const { Cell } = await loadTonCore();
        Cell.fromBase64(bocString);

        return true;
    } catch {
        return false;
    }
}

/**
 * Extract estimated fees from transaction (placeholder)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function estimateTransactionFees(messages: any[]): string {
    // TODO: Implement proper fee calculation
    // This would typically involve:
    // - Analyzing message complexity
    // - Calculating gas costs
    // - Including network fees

    const baseFeePerMessage = 5000000; // 0.005 TON per message
    const totalFees = messages.length * baseFeePerMessage;

    return totalFees.toString();
}
