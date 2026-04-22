/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Wallet } from '../api/interfaces';
import type { WalletManager } from '../core/WalletManager';
import { ERROR_CODES, WalletKitError } from '../errors';
import type { ApiClient } from '../types/toncenter/ApiClient';

/**
 * Helper to get wallet from event
 */
export function getWalletFromEvent(walletManager: WalletManager, event: { walletId?: string }): Wallet | undefined {
    if (event.walletId) {
        return walletManager.getWallet(event.walletId);
    }
    return undefined;
}

export function getWalletAddressFromEvent(
    walletManager: WalletManager,
    event: { walletId?: string; walletAddress?: string },
): string | undefined {
    if (event.walletAddress) {
        return event.walletAddress;
    }
    if (event.walletId) {
        return walletManager.getWallet(event.walletId)?.getAddress();
    }
    return undefined;
}

export function getClientForWallet(walletManager: WalletManager, event: { walletId?: string }): ApiClient {
    const wallet = getWalletFromEvent(walletManager, event);
    if (!wallet) {
        throw new WalletKitError(ERROR_CODES.WALLET_NOT_FOUND, `Wallet not found: ${event.walletId}`);
    }

    return wallet.getClient();
}
