/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { WalletKitError, ERROR_CODES } from '../errors';

let tonCryptoModule: typeof import('@ton/crypto') | null = null;

/**
 * Lazily load @ton/crypto module.
 * This allows tree-shaking when the module is not used.
 *
 * @throws {WalletKitError} If @ton/crypto is not installed
 */
export async function loadTonCrypto(): Promise<typeof import('@ton/crypto')> {
    if (!tonCryptoModule) {
        try {
            tonCryptoModule = await import('@ton/crypto');
        } catch {
            throw new WalletKitError(
                ERROR_CODES.DEPENDENCY_NOT_FOUND,
                '@ton/crypto is required for this feature. Install it: pnpm add @ton/crypto',
            );
        }
    }
    return tonCryptoModule;
}
