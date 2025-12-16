/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ERROR_CODES, WalletKitError } from '../errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached: any = null;

/**
 * Lazily load @ton/crypto module.
 * @throws WalletKitError if @ton/crypto is not installed
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export async function loadTonCrypto(): Promise<typeof import('@ton/crypto')> {
    if (!cached) {
        try {
            cached = await import('@ton/crypto');
        } catch {
            throw new WalletKitError(ERROR_CODES.DEPENDENCY_NOT_FOUND, '@ton/crypto is required');
        }
    }
    return cached;
}
