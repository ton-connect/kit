/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UseMutationResult } from '@tanstack/react-query';
import { buildStakeTransactionMutationOptions } from '@ton/appkit/queries';
import type {
    BuildStakeTransactionData,
    BuildStakeTransactionErrorType,
    BuildStakeTransactionVariables,
} from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useMutation } from '../../../libs/query';

/**
 * Return type of {@link useBuildStakeTransaction} — TanStack Query mutation result that resolves to a {@link TransactionRequest}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type UseBuildStakeTransactionReturnType<context = unknown> = UseMutationResult<
    BuildStakeTransactionData,
    BuildStakeTransactionErrorType,
    BuildStakeTransactionVariables,
    context
>;

/**
 * React mutation hook that wraps {@link buildStakeTransaction} — turns a {@link StakingQuote} obtained via {@link useStakingQuote} into a {@link TransactionRequest} without sending it, so the UI can inspect or batch before signing. Returns `mutate(params)` where `params` matches {@link BuildStakeTransactionOptions}.
 *
 * @returns Mutation result for the build call.
 *
 * @public
 * @category Hook
 * @section Staking
 */
export const useBuildStakeTransaction = <context = unknown>(): UseBuildStakeTransactionReturnType<context> => {
    const appKit = useAppKit();
    return useMutation(buildStakeTransactionMutationOptions<context>(appKit));
};
