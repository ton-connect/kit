/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapParams } from '../../swap';
import type { TransactionRequest } from '../../types/transaction';
import type { AppKit } from '../../core/app-kit';

/**
 * Options for {@link buildSwapTransaction} — same shape as {@link SwapParams}.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type BuildSwapTransactionOptions<T = unknown> = SwapParams<T>;

/**
 * Return type of {@link buildSwapTransaction}.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type BuildSwapTransactionReturnType = Promise<TransactionRequest>;

/**
 * Build a {@link TransactionRequest} that executes a swap previously quoted by {@link getSwapQuote} — returns it without sending so the UI can inspect or batch before signing.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link BuildSwapTransactionOptions} Quote and provider-specific options.
 * @returns Transaction request ready to pass to `sendTransaction`.
 *
 * @sample docs/examples/src/appkit/actions/swap#BUILD_SWAP_TRANSACTION
 * @expand options
 *
 * @public
 * @category Action
 * @section Swap
 */
export const buildSwapTransaction = async <T = unknown>(
    appKit: AppKit,
    options: BuildSwapTransactionOptions<T>,
): BuildSwapTransactionReturnType => {
    return appKit.swapManager.buildSwapTransaction(options);
};
