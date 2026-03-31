/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UnstakeParams } from '@ton/walletkit';

import type { TransactionRequest } from '../../types/transaction';
import type { AppKit } from '../../core/app-kit';

export type BuildUnstakeTransactionOptions = UnstakeParams & {
    providerId?: string;
};

export type BuildUnstakeTransactionReturnType = Promise<TransactionRequest>;

/**
 * Build unstake transaction
 */
export const buildUnstakeTransaction = async (
    appKit: AppKit,
    options: BuildUnstakeTransactionOptions,
): BuildUnstakeTransactionReturnType => {
    return appKit.stakingManager.buildUnstakeTransaction(options, options.providerId);
};
