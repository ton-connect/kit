/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { UseMutationResult } from '@tanstack/react-query';
import { buildSwapTransactionMutationOptions } from '@ton/appkit/queries';
import type {
    BuildSwapTransactionData,
    BuildSwapTransactionErrorType,
    BuildSwapTransactionMutationOptions,
    BuildSwapTransactionVariables,
} from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useMutation } from '../../../libs/query';

/**
 * Parameters accepted by {@link useBuildSwapTransaction} — TanStack Query mutation options.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type UseBuildSwapTransactionParameters<context = unknown> = BuildSwapTransactionMutationOptions<context>;

/**
 * Return type of {@link useBuildSwapTransaction} — TanStack Query mutation result.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type UseBuildSwapTransactionReturnType<context = unknown> = UseMutationResult<
    BuildSwapTransactionData,
    BuildSwapTransactionErrorType,
    BuildSwapTransactionVariables,
    context
>;

/**
 * React mutation hook that wraps {@link appkit:buildSwapTransaction} — turns a {@link appkit:SwapQuote} obtained via {@link useSwapQuote} into a {@link appkit:TransactionRequest} without sending it, so the UI can inspect or batch before signing. Returns `mutate(params)` where `params` matches {@link appkit:BuildSwapTransactionOptions}.
 *
 * @param parameters - {@link UseBuildSwapTransactionParameters} TanStack Query mutation overrides.
 * @returns Mutation result for the build call.
 *
 * @public
 * @category Hook
 * @section Swap
 */
export const useBuildSwapTransaction = <context = unknown>(
    parameters?: UseBuildSwapTransactionParameters<context>,
): UseBuildSwapTransactionReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(buildSwapTransactionMutationOptions(appKit, parameters));
};
