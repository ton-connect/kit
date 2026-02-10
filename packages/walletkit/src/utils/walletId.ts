/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Wallet ID utilities for multi-network support

import { sha256_sync } from '@ton/crypto';

import type { Network } from '../api/models/core/Network';

/**
 * Wallet ID - unique identifier for a wallet, should be different for similar wallets on different networks
 */
export type WalletId = string;

/**
 * Creates a wallet ID from network and address
 */
export function createWalletId(network: Network, address: string): WalletId {
    return sha256_sync(`${network.chainId}:${address}`).toString('base64');
}
