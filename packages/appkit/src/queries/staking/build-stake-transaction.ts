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
import { buildStakeTransaction } from '../../actions/staking/build-stake-transaction';
import type {
    BuildStakeTransactionOptions,
    BuildStakeTransactionReturnType,
} from '../../actions/staking/build-stake-transaction';

export type BuildStakeTransactionMutationOptions<context = unknown> = MutationParameter<
    BuildStakeTransactionData,
    BuildStakeTransactionErrorType,
    BuildStakeTransactionVariables,
    context
>;

export const buildStakeTransactionMutationOptions = <context = unknown>(
    appKit: AppKit,
    options: BuildStakeTransactionMutationOptions<context> = {},
): BuildStakeTransactionMutationConfig<context> => {
    return {
        ...options.mutation,
        mutationFn(variables) {
            return buildStakeTransaction(appKit, variables);
        },
        mutationKey: ['buildStakeTransaction'],
    };
};

export type BuildStakeTransactionMutationConfig<context = unknown> = MutationOptions<
    BuildStakeTransactionData,
    BuildStakeTransactionErrorType,
    BuildStakeTransactionVariables,
    context
>;

export type BuildStakeTransactionData = Compute<Awaited<BuildStakeTransactionReturnType>>;

export type BuildStakeTransactionErrorType = Error;

export type BuildStakeTransactionVariables = BuildStakeTransactionOptions;

export type BuildStakeTransactionMutate<context = unknown> = (
    variables: BuildStakeTransactionVariables,
    options?:
        | Compute<
              MutateOptions<
                  BuildStakeTransactionData,
                  BuildStakeTransactionErrorType,
                  Compute<BuildStakeTransactionVariables>,
                  context
              >
          >
        | undefined,
) => void;

export type BuildStakeTransactionMutateAsync<context = unknown> = (
    variables: BuildStakeTransactionVariables,
    options?:
        | Compute<
              MutateOptions<
                  BuildStakeTransactionData,
                  BuildStakeTransactionErrorType,
                  Compute<BuildStakeTransactionVariables>,
                  context
              >
          >
        | undefined,
) => Promise<BuildStakeTransactionData>;
