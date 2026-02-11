/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequest, SwapParams } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export type BuildSwapTransactionOptions<T = unknown> = SwapParams<T>;

export type BuildSwapTransactionReturnType = Promise<TransactionRequest>;

/**
 * Build swap transaction
 */
export const buildSwapTransaction = async <T = unknown>(
    appKit: AppKit,
    options: BuildSwapTransactionOptions<T>,
): BuildSwapTransactionReturnType => {
    return appKit.swapManager.buildSwapTransaction(options);
};
