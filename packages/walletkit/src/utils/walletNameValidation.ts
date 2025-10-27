/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Wallet name validation utilities for safe JS Bridge injection

import { WalletKitError, ERROR_CODES } from '../errors';

/**
 * Validates a wallet name for safe injection into window object
 * @param walletName - The wallet name to validate
 * @throws Error if wallet name is invalid
 */
export function validateWalletName(walletName: string): void {
    // Basic type and emptiness check
    if (!walletName || typeof walletName !== 'string') {
        throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Wallet name must be a non-empty string');
    }

    // Trim and check again after trimming
    const trimmed = walletName.trim();
    if (!trimmed) {
        throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Wallet name cannot be empty or only whitespace');
    }
}

/**
 * Sanitizes and validates a wallet name
 * @param walletName - The wallet name to sanitize and validate
 * @returns The sanitized wallet name
 * @throws Error if wallet name is invalid
 */
export function sanitizeWalletName(walletName: string): string {
    validateWalletName(walletName);
    return walletName.trim();
}

/**
 * Checks if a wallet name is safe without throwing
 * @param walletName - The wallet name to check
 * @returns true if valid, false otherwise
 */
export function isValidWalletName(walletName: string): boolean {
    try {
        validateWalletName(walletName);
        return true;
    } catch {
        return false;
    }
}
