/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Shared mutable bridge state.
 */

import type { WalletKitInstance } from '../types';

export let walletKit: WalletKitInstance | null = null;

/**
 * Sets the WalletKit instance reference.
 *
 * @param instance - The instantiated WalletKit or null when reset.
 */
export function setWalletKit(instance: WalletKitInstance | null): void {
    walletKit = instance;
}
