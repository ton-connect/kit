/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Re-export types (tree-shaken, no runtime cost)
export type {
    Address,
    Cell,
    Builder,
    Slice,
    SendMode,
    ExtraCurrency,
    AccountStatus,
    TupleItem,
    MessageRelaxed,
    StateInit,
    Dictionary,
} from '@ton/core';

import { WalletKitError, ERROR_CODES } from '../errors';

let tonCoreModule: typeof import('@ton/core') | null = null;

/**
 * Lazily load @ton/core module.
 * This allows tree-shaking when the module is not used.
 *
 * @throws {WalletKitError} If @ton/core is not installed
 */
export async function loadTonCore(): Promise<typeof import('@ton/core')> {
    if (!tonCoreModule) {
        try {
            tonCoreModule = await import('@ton/core');
        } catch {
            throw new WalletKitError(
                ERROR_CODES.DEPENDENCY_NOT_FOUND,
                '@ton/core is required for this feature. Install it: pnpm add @ton/core',
            );
        }
    }
    return tonCoreModule;
}

/**
 * Get already loaded @ton/core module synchronously.
 * Use this only in code paths where loadTonCore() has already been called.
 *
 * @throws {WalletKitError} If @ton/core is not loaded yet
 */
export function getTonCore(): typeof import('@ton/core') {
    if (!tonCoreModule) {
        throw new WalletKitError(
            ERROR_CODES.DEPENDENCY_NOT_FOUND,
            '@ton/core is not loaded. Call loadTonCore() first.',
        );
    }
    return tonCoreModule;
}
