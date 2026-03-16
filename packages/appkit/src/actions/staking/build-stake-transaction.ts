/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StakeParams } from '@ton/walletkit';

import type { TransactionRequest } from '../../types/transaction';
import type { AppKit } from '../../core/app-kit';

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
