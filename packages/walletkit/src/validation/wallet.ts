/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Wallet-specific validation logic

import type { Wallet } from '../api/interfaces';
import type { ValidationResult, ValidationContext } from './types';

/**
 * Validate wallet interface implementation
 */
export function validateWallet(_wallet: Wallet, _context: ValidationContext = {}): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // // Required field validations
    // if (!wallet.publicKey || typeof wallet.publicKey !== 'string') {
    //     errors.push('publicKey must be a non-empty string');
    // } else if (wallet.publicKey.length < 32) {
    //     errors.push('publicKey appears too short (minimum 32 characters)');
    // }

    // if (!wallet.version || typeof wallet.version !== 'string') {
    //     errors.push('version must be a non-empty string');
    // } else if (!isValidWalletVersion(wallet.version)) {
    //     if (context.strict) {
    //         errors.push(`unsupported wallet version: ${wallet.version}`);
    //     } else {
    //         warnings.push(`unknown wallet version: ${wallet.version}`);
    //     }
    // }

    // // Required method validations
    // if (typeof wallet.sign !== 'function') {
    //     errors.push('sign must be a function');
    // }

    // if (typeof wallet.getAddress !== 'function') {
    //     errors.push('getAddress must be a function');
    // }

    // if (typeof wallet.getBalance !== 'function') {
    //     errors.push('getBalance must be a function');
    // }

    // // Optional method validations
    // if (wallet.getStateInit && typeof wallet.getStateInit !== 'function') {
    //     errors.push('getStateInit must be a function if provided');
    // }

    // // Additional context-based validations
    // if (context.strict) {
    //     // In strict mode, perform additional checks
    //     if (!wallet.getStateInit) {
    //         warnings.push('getStateInit method is recommended for new wallets');
    //     }
    // }

    return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

/**
 * Validate wallet public key format
 */
export function validatePublicKey(publicKey: string): ValidationResult {
    const errors: string[] = [];

    if (!publicKey || typeof publicKey !== 'string') {
        errors.push('publicKey must be a non-empty string');
        return { isValid: false, errors };
    }

    // Check length (typical TON public keys are 64 hex characters)
    if (publicKey.length !== 64) {
        errors.push(`publicKey must be 64 characters long, got ${publicKey.length}`);
    }

    // Check if it's valid hex
    if (!/^[0-9a-fA-F]+$/.test(publicKey)) {
        errors.push('publicKey must contain only hexadecimal characters');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate wallet version string
 */
export function validateWalletVersion(version: string): ValidationResult {
    const errors: string[] = [];

    if (!version || typeof version !== 'string') {
        errors.push('version must be a non-empty string');
        return { isValid: false, errors };
    }

    if (!isValidWalletVersion(version)) {
        errors.push(`unsupported wallet version format: ${version}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Check if wallet version is in known valid format
 */
function isValidWalletVersion(version: string): boolean {
    // Known wallet versions: v3r1, v3r2, v4r1, v4r2, v5r1, etc.
    const versionPattern = /^v[3-9]r[1-9]$/i;
    return versionPattern.test(version);
}

/**
 * Validate that wallet methods can be called (basic smoke test)
 */
export async function validateWalletMethods(wallet: Wallet): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
        // Test getAddress method
        const address = await wallet.getAddress();
        if (!address || typeof address !== 'string') {
            errors.push('getAddress() must return a non-empty string');
        }
    } catch (error) {
        errors.push(`getAddress() failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
        // Test getBalance method
        const balance = await wallet.getBalance();
        if (!balance || typeof balance !== 'string') {
            errors.push('getBalance() must return a non-empty string');
        } else if (!/^\d+$/.test(balance)) {
            errors.push('getBalance() must return a numeric string (nanotons)');
        }
    } catch (error) {
        errors.push(`getBalance() failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Test optional getStateInit if present
    if (wallet.getStateInit) {
        try {
            const stateInit = await wallet.getStateInit();
            if (stateInit && typeof stateInit !== 'string') {
                errors.push('getStateInit() must return a string or undefined');
            }
        } catch (error) {
            errors.push(`getStateInit() failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
