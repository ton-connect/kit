/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { StakeParams } from '../../staking';
import type { TransactionRequest } from '../../types/transaction';

export type BuildStakeTransactionOptions = StakeParams & {
    providerId?: string;
};

export type BuildStakeTransactionReturnType = Promise<TransactionRequest>;

/**
 * Build stake transaction
 */
export const buildStakeTransaction = async (
    appKit: AppKit,
    options: BuildStakeTransactionOptions,
): BuildStakeTransactionReturnType => {
    return appKit.stakingManager.buildStakeTransaction(options, options.providerId);
};
