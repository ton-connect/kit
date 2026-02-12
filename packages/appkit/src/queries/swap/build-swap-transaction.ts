/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateOptions, MutationOptions } from '@tanstack/query-core';

import type { AppKit } from '../../core/app-kit';
import type { MutationParameter } from '../../types/query';
import type { Compute } from '../../types/utils';
import { buildSwapTransaction } from '../../actions/swap/build-swap-transaction';
import type {
    BuildSwapTransactionOptions,
    BuildSwapTransactionReturnType,
} from '../../actions/swap/build-swap-transaction';

export type BuildSwapTransactionMutationOptions<context = unknown> = MutationParameter<
    BuildSwapTransactionData,
    BuildSwapTransactionErrorType,
    BuildSwapTransactionVariables,
    context
>;

export const buildSwapTransactionMutationOptions = <context = unknown>(
    appKit: AppKit,
    options: BuildSwapTransactionMutationOptions<context> = {},
): BuildSwapTransactionMutationConfig<context> => {
    return {
        ...options.mutation,
        mutationFn(variables) {
            const { quote, userAddress } = variables;
            if (!quote || !userAddress) {
                throw new Error('Required parameters "quote" and "userAddress" are missing');
            }

            return buildSwapTransaction(appKit, variables);
        },
        mutationKey: ['buildSwapTransaction'],
    };
};

export type BuildSwapTransactionMutationConfig<context = unknown> = MutationOptions<
    BuildSwapTransactionData,
    BuildSwapTransactionErrorType,
    BuildSwapTransactionVariables,
    context
>;

export type BuildSwapTransactionData = Compute<Awaited<BuildSwapTransactionReturnType>>;

export type BuildSwapTransactionErrorType = Error;

export type BuildSwapTransactionVariables = BuildSwapTransactionOptions;

export type BuildSwapTransactionMutate<context = unknown> = (
    variables: BuildSwapTransactionVariables,
    options?:
        | Compute<
              MutateOptions<
                  BuildSwapTransactionData,
                  BuildSwapTransactionErrorType,
                  Compute<BuildSwapTransactionVariables>,
                  context
              >
          >
        | undefined,
) => void;

export type BuildSwapTransactionMutateAsync<context = unknown> = (
    variables: BuildSwapTransactionVariables,
    options?:
        | Compute<
              MutateOptions<
                  BuildSwapTransactionData,
                  BuildSwapTransactionErrorType,
                  Compute<BuildSwapTransactionVariables>,
                  context
              >
          >
        | undefined,
) => Promise<BuildSwapTransactionData>;
