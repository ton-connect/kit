/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// TON address validation logic

import { CHAIN } from '@tonconnect/protocol';

import type { ValidationResult, ValidationContext } from './types';
import { loadTonCore } from '../deps/tonCore';

/**
 * Validate TON address format
 */
export async function validateTonAddress(address: string, context: ValidationContext = {}): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!address || typeof address !== 'string') {
        errors.push('address must be a non-empty string');
        return { isValid: false, errors };
    }

    // Check different TON address formats
    const validationResults = await Promise.all([
        validateRawAddress(address),
        validateBouncableAddress(address),
        validateNonBouncableAddress(address),
    ]);

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
export async function validateRawAddress(address: string): Promise<ValidationResult> {
    const { Address } = await loadTonCore();
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
export async function validateBouncableAddress(address: string): Promise<ValidationResult> {
    const { Address } = await loadTonCore();
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
export async function validateNonBouncableAddress(address: string): Promise<ValidationResult> {
    const { Address } = await loadTonCore();
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
export async function detectAddressFormat(
    address: string,
): Promise<'raw' | 'bounceable' | 'non-bounceable' | 'unknown'> {
    if ((await validateRawAddress(address)).isValid) return 'raw';
    if ((await validateBouncableAddress(address)).isValid) return 'bounceable';
    if ((await validateNonBouncableAddress(address)).isValid) return 'non-bounceable';
    return 'unknown';
}

/**
 * Check if address is for mainnet or testnet
 */
export async function detectAddressNetwork(address: string): Promise<CHAIN | 'unknown'> {
    const format = await detectAddressFormat(address);

    if (format === 'raw') {
        return 'unknown';
    }

    if (format === 'bounceable' || format === 'non-bounceable') {
        const { Address } = await loadTonCore();
        const parsed = Address.parseFriendly(address);
        if (parsed.isTestOnly) {
            return CHAIN.TESTNET;
        } else {
            return CHAIN.MAINNET;
        }
    }

    return 'unknown';
}
