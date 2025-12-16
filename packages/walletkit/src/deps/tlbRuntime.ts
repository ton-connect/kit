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
 * Lazily load @ton-community/tlb-runtime module.
 * @throws WalletKitError if @ton-community/tlb-runtime is not installed
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export async function loadTlbRuntime(): Promise<typeof import('@ton-community/tlb-runtime')> {
    if (!cached) {
        try {
            cached = await import('@ton-community/tlb-runtime');
        } catch {
            throw new WalletKitError(ERROR_CODES.DEPENDENCY_NOT_FOUND, '@ton-community/tlb-runtime is required');
        }
    }
    return cached;
}
