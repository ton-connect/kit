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
import { buildUnstakeTransaction } from '../../actions/staking/build-unstake-transaction';
import type {
    BuildUnstakeTransactionOptions,
    BuildUnstakeTransactionReturnType,
} from '../../actions/staking/build-unstake-transaction';

export type BuildUnstakeTransactionMutationOptions<context = unknown> = MutationParameter<
    BuildUnstakeTransactionData,
    BuildUnstakeTransactionErrorType,
    BuildUnstakeTransactionVariables,
    context
>;

export const buildUnstakeTransactionMutationOptions = <context = unknown>(
    appKit: AppKit,
    options: BuildUnstakeTransactionMutationOptions<context> = {},
): BuildUnstakeTransactionMutationConfig<context> => {
    return {
        ...options.mutation,
        mutationFn(variables) {
            return buildUnstakeTransaction(appKit, variables);
        },
        mutationKey: ['buildUnstakeTransaction'],
    };
};

export type BuildUnstakeTransactionMutationConfig<context = unknown> = MutationOptions<
    BuildUnstakeTransactionData,
    BuildUnstakeTransactionErrorType,
    BuildUnstakeTransactionVariables,
    context
>;

export type BuildUnstakeTransactionData = Compute<Awaited<BuildUnstakeTransactionReturnType>>;

export type BuildUnstakeTransactionErrorType = Error;

export type BuildUnstakeTransactionVariables = BuildUnstakeTransactionOptions;

export type BuildUnstakeTransactionMutate<context = unknown> = (
    variables: BuildUnstakeTransactionVariables,
    options?:
        | Compute<
              MutateOptions<
                  BuildUnstakeTransactionData,
                  BuildUnstakeTransactionErrorType,
                  Compute<BuildUnstakeTransactionVariables>,
                  context
              >
          >
        | undefined,
) => void;

export type BuildUnstakeTransactionMutateAsync<context = unknown> = (
    variables: BuildUnstakeTransactionVariables,
    options?:
        | Compute<
              MutateOptions<
                  BuildUnstakeTransactionData,
                  BuildUnstakeTransactionErrorType,
                  Compute<BuildUnstakeTransactionVariables>,
                  context
              >
          >
        | undefined,
) => Promise<BuildUnstakeTransactionData>;
