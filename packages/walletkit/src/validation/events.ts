/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Bridge event validation logic

import type { ValidationResult, ValidationContext } from './types';

/**
 * Validate bridge event structure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateBridgeEvent(event: any, context: ValidationContext = {}): ValidationResult {
    const errors: string[] = [];

    if (!event || typeof event !== 'object') {
        errors.push('event must be an object');
        return { isValid: false, errors };
    }

    // Required fields
    if (!event.id || typeof event.id !== 'string') {
        errors.push('event.id must be a non-empty string');
    }

    if (!event.method || typeof event.method !== 'string') {
        errors.push('event.method must be a non-empty string');
    } else if (!isValidEventMethod(event.method)) {
        if (context.strict) {
            errors.push(`unsupported event method: ${event.method}`);
        }
    }

    // Optional but validated fields
    if (event.params && typeof event.params !== 'object') {
        errors.push('event.params must be an object if provided');
    }

    if (event.sessionId && typeof event.sessionId !== 'string') {
        errors.push('event.sessionId must be a string if provided');
    }

    if (event.timestamp && typeof event.timestamp !== 'number') {
        errors.push('event.timestamp must be a number if provided');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate connect event parameters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateConnectEventParams(params: any): ValidationResult {
    const errors: string[] = [];

    if (!params || typeof params !== 'object') {
        errors.push('connect params must be an object');
        return { isValid: false, errors };
    }

    // Validate manifest URL if present
    if (params.manifestUrl && typeof params.manifestUrl !== 'string') {
        errors.push('manifestUrl must be a string if provided');
    } else if (params.manifestUrl && !isValidUrl(params.manifestUrl)) {
        errors.push('manifestUrl must be a valid URL');
    }

    // Validate requested items
    if (params.items && !Array.isArray(params.items)) {
        errors.push('items must be an array if provided');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate transaction event parameters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateTransactionEventParams(params: any): ValidationResult {
    const errors: string[] = [];

    if (!params || typeof params !== 'object') {
        errors.push('transaction params must be an object');
        return { isValid: false, errors };
    }

    // Validate required fields
    if (!params.messages || !Array.isArray(params.messages)) {
        errors.push('messages must be a non-empty array');
    } else if (params.messages.length === 0) {
        errors.push('messages array cannot be empty');
    }

    if (params.from && typeof params.from !== 'string') {
        errors.push('from address must be a string if provided');
    }

    if (params.validUntil && typeof params.validUntil !== 'number') {
        errors.push('validUntil must be a number if provided');
    } else if (params.validUntil && params.validUntil <= Date.now() / 1000) {
        errors.push('validUntil must be a future timestamp');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate sign data event parameters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateSignDataEventParams(params: any): ValidationResult {
    const errors: string[] = [];

    if (!params || typeof params !== 'object') {
        errors.push('sign data params must be an object');
        return { isValid: false, errors };
    }

    // Check for data in various possible formats
    const hasData = params.data || params.message || params.payload;
    if (!hasData) {
        errors.push('sign data params must contain data, message, or payload field');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Check if event method is supported
 */
function isValidEventMethod(method: string): boolean {
    const supportedMethods = [
        'connect',
        'sendTransaction',
        'signData',
        'disconnect',
        'tonconnect_connect',
        'tonconnect_sendTransaction',
        'tonconnect_signData',
        'tonconnect_disconnect',
        'wallet_connect',
        'wallet_disconnect',
        'personal_sign',
    ];

    return supportedMethods.includes(method);
}

/**
 * Basic URL validation
 */
function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
