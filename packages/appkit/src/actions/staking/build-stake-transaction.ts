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

/**
 * Options for {@link buildStakeTransaction} — extends {@link StakeParams} with an optional provider override.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type BuildStakeTransactionOptions = StakeParams & {
    /** Provider to stake/unstake through; defaults to the registered default staking provider. */
    providerId?: string;
};

/**
 * Return type of {@link buildStakeTransaction}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type BuildStakeTransactionReturnType = Promise<TransactionRequest>;

/**
 * Build a {@link TransactionRequest} that executes a stake or unstake previously quoted by {@link getStakingQuote} — returns it without sending so the UI can inspect or batch before signing.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link BuildStakeTransactionOptions} Quote and optional provider override.
 * @returns Transaction request ready to pass to `sendTransaction`.
 *
 * @sample docs/examples/src/appkit/actions/staking#BUILD_STAKE_TRANSACTION
 * @expand options
 *
 * @public
 * @category Action
 * @section Staking
 */
export const buildStakeTransaction = async (
    appKit: AppKit,
    options: BuildStakeTransactionOptions,
): BuildStakeTransactionReturnType => {
    return appKit.stakingManager.buildStakeTransaction(options, options.providerId);
};
