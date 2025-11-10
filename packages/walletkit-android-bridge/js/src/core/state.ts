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
export let initialized = false;
export let currentNetwork: string = '';
export let currentApiBase: string = 'https://testnet.tonapi.io';

/**
 * Persists the WalletKit instance reference.
 *
 * @param instance - The instantiated WalletKit or null when reset.
 */
export function setWalletKit(instance: WalletKitInstance | null): void {
    walletKit = instance;
}

/**
 * Persists the initialization flag.
 *
 * @param value - Whether WalletKit has completed initialization.
 */
export function setInitialized(value: boolean): void {
    initialized = value;
}

/**
 * Persists the current network identifier.
 *
 * @param network - Network value reported by WalletKit.
 */
export function setCurrentNetwork(network: string): void {
    currentNetwork = network;
}

/**
 * Persists the current TON API base URL.
 *
 * @param apiBase - Base URL used for TON API calls.
 */
export function setCurrentApiBase(apiBase: string): void {
    currentApiBase = apiBase;
}
