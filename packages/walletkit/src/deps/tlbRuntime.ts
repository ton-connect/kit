/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { WalletKitError, ERROR_CODES } from '../errors';

let tlbRuntimeModule: typeof import('@ton-community/tlb-runtime') | null = null;

/**
 * Lazily load @ton-community/tlb-runtime module.
 * This allows tree-shaking when the module is not used.
 *
 * @throws {WalletKitError} If @ton-community/tlb-runtime is not installed
 */
export async function loadTlbRuntime(): Promise<typeof import('@ton-community/tlb-runtime')> {
    if (!tlbRuntimeModule) {
        try {
            tlbRuntimeModule = await import('@ton-community/tlb-runtime');
        } catch {
            throw new WalletKitError(
                ERROR_CODES.DEPENDENCY_NOT_FOUND,
                '@ton-community/tlb-runtime is required for this feature. Install it: pnpm add @ton-community/tlb-runtime',
            );
        }
    }
    return tlbRuntimeModule;
}
