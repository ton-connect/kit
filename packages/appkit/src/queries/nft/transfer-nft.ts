/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateOptions, MutationOptions } from '@tanstack/query-core';

import { transferNft } from '../../actions/nft/transfer-nft';
import type { TransferNftParameters, TransferNftReturnType } from '../../actions/nft/transfer-nft';
import type { AppKit } from '../../core/app-kit';
import type { MutationParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type { TransferNftParameters, TransferNftReturnType };

export type TransferNftErrorType = Error;

export type TransferNftOptions<context = unknown> = MutationParameter<
    TransferNftData,
    TransferNftErrorType,
    TransferNftVariables,
    context
>;

export const transferNftMutationOptions = <context = unknown>(
    appKit: AppKit,
    options: TransferNftOptions<context> = {},
): TransferNftMutationOptions<context> => {
    return {
        ...options.mutation,
        mutationFn(variables) {
            return transferNft(appKit, variables);
        },
        mutationKey: ['transferNft'],
    };
};

export type TransferNftMutationOptions<context = unknown> = MutationOptions<
    TransferNftData,
    TransferNftErrorType,
    TransferNftVariables,
    context
>;

export type TransferNftData = Compute<TransferNftReturnType>;

export type TransferNftVariables = TransferNftParameters;

export type TransferNftMutate<context = unknown> = (
    variables: TransferNftVariables,
    options?:
        | Compute<MutateOptions<TransferNftData, TransferNftErrorType, Compute<TransferNftVariables>, context>>
        | undefined,
) => void;

export type TransferNftMutateAsync<context = unknown> = (
    variables: TransferNftVariables,
    options?:
        | Compute<MutateOptions<TransferNftData, TransferNftErrorType, Compute<TransferNftVariables>, context>>
        | undefined,
) => Promise<TransferNftData>;
