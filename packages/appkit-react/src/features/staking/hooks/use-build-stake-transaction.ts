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
 * Return type of {@link useBuildStakeTransaction} — TanStack Query mutation result that resolves to a {@link appkit:TransactionRequest}.
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
 * Build a stake/unstake {@link appkit:TransactionRequest} from a {@link appkit:StakingQuote} (obtained via {@link useStakingQuote}) without sending it — lets the UI inspect, batch, or pass the request to {@link useSendTransaction} separately. Call `mutate(params)` where `params` matches {@link appkit:BuildStakeTransactionOptions} (quote + user address, optional provider override); the resulting `TransactionRequest` is in `data` once the mutation resolves.
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
