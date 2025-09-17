// TON address validation logic

import { CHAIN } from '@tonconnect/protocol';
import { Address } from '@ton/core';

import type { ValidationResult, ValidationContext } from './types';

/**
 * Validate TON address format
 */
export function validateTonAddress(address: string, context: ValidationContext = {}): ValidationResult {
    const errors: string[] = [];

    if (!address || typeof address !== 'string') {
        errors.push('address must be a non-empty string');
        return { isValid: false, errors };
    }

    // Check different TON address formats
    const validationResults = [
        validateRawAddress(address),
        validateBouncableAddress(address),
        validateNonBouncableAddress(address),
    ];

    // If none of the formats are valid, collect all errors
    const allValid = validationResults.some((result) => result.isValid);

    if (!allValid) {
        errors.push('address must be in valid TON format (raw, bounceable, or non-bounceable)');

        if (context.strict) {
            // Include specific format errors in strict mode
            validationResults.forEach((result, index) => {
                const formats = ['raw', 'bounceable', 'non-bounceable'];
                errors.push(`${formats[index]} format: ${result.errors.join(', ')}`);
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate raw TON address (workchain:hex)
 */
export function validateRawAddress(address: string): ValidationResult {
    const errors: string[] = [];

    try {
        if (!Address.isRaw(address)) {
            errors.push('raw address must be in format "workchain:account_id" where account_id is 64 hex chars');
        }
    } catch {
        errors.push('raw address must be in format "workchain:account_id" where account_id is 64 hex chars');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate bounceable address (base64 encoded)
 */
export function validateBouncableAddress(address: string): ValidationResult {
    const errors: string[] = [];

    try {
        const isFriendlyAddress = Address.isFriendly(address);
        if (!isFriendlyAddress) {
            errors.push('Address is not friendly');
        } else {
            const parsed = Address.parseFriendly(address);
            if (!parsed.isBounceable) {
                errors.push('Address is not bounceable');
            }
        }
    } catch {
        errors.push('bounceable address must be in format "EQ" or "UQ" followed by 46 base64url chars');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate non-bounceable address (base64 encoded)
 */
export function validateNonBouncableAddress(address: string): ValidationResult {
    const errors: string[] = [];

    try {
        const isFriendlyAddress = Address.isFriendly(address);
        if (!isFriendlyAddress) {
            errors.push('Address is not friendly');
        } else {
            const parsed = Address.parseFriendly(address);
            if (parsed.isBounceable) {
                errors.push('Address is bounceable');
            }
        }
    } catch {
        errors.push('non bounceable address must be in format "EQ" or "UQ" followed by 46 base64url chars');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Detect TON address format
 */
export function detectAddressFormat(address: string): 'raw' | 'bounceable' | 'non-bounceable' | 'unknown' {
    if (validateRawAddress(address).isValid) return 'raw';
    if (validateBouncableAddress(address).isValid) return 'bounceable';
    if (validateNonBouncableAddress(address).isValid) return 'non-bounceable';
    return 'unknown';
}

/**
 * Check if address is for mainnet or testnet
 */
export function detectAddressNetwork(address: string): CHAIN | 'unknown' {
    const format = detectAddressFormat(address);

    if (format === 'raw') {
        return 'unknown';
    }

    if (format === 'bounceable' || format === 'non-bounceable') {
        const parsed = Address.parseFriendly(address);
        if (parsed.isTestOnly) {
            return CHAIN.TESTNET;
        } else {
            return CHAIN.MAINNET;
        }
    }

    return 'unknown';
}
