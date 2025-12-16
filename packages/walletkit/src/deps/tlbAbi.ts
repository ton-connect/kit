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
 * Lazily load @truecarry/tlb-abi module.
 * @throws Error if @truecarry/tlb-abi is not installed
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export async function loadTlbAbi(): Promise<typeof import('@truecarry/tlb-abi')> {
    if (!cached) {
        try {
            cached = await import('@truecarry/tlb-abi');
        } catch {
            throw new WalletKitError(ERROR_CODES.DEPENDENCY_NOT_FOUND, '@truecarry/tlb-abi is required');
        }
    }
    return cached;
}
