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

import { useAppKit } from '../../../hooks/use-app-kit';
import { useMutation } from '../../../libs/query';

export type UseBuildSwapTransactionParameters<context = unknown> = BuildSwapTransactionMutationOptions<context>;

export type UseBuildSwapTransactionReturnType<context = unknown> = UseMutationResult<
    BuildSwapTransactionData,
    BuildSwapTransactionErrorType,
    BuildSwapTransactionVariables,
    context
>;

export const useBuildSwapTransaction = <context = unknown>(
    parameters?: UseBuildSwapTransactionParameters<context>,
): UseBuildSwapTransactionReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(buildSwapTransactionMutationOptions(appKit, parameters));
};
