/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UseMutationResult } from '@tanstack/react-query';
import { buildUnstakeTransactionMutationOptions } from '@ton/appkit/queries';
import type {
    BuildUnstakeTransactionData,
    BuildUnstakeTransactionErrorType,
    BuildUnstakeTransactionVariables,
} from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useMutation } from '../../../libs/query';

export type UseBuildUnstakeTransactionReturnType<context = unknown> = UseMutationResult<
    BuildUnstakeTransactionData,
    BuildUnstakeTransactionErrorType,
    BuildUnstakeTransactionVariables,
    context
>;

/**
 * Hook to build unstake transaction
 */
export const useBuildUnstakeTransaction = <context = unknown>(): UseBuildUnstakeTransactionReturnType<context> => {
    const appKit = useAppKit();
    return useMutation(buildUnstakeTransactionMutationOptions<context>(appKit));
};
