/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutationOptions } from '@tanstack/query-core';

import { estimateGasless } from '../../actions/gasless/estimate-gasless';
import type {
    EstimateGaslessErrorType,
    EstimateGaslessParameters,
    EstimateGaslessReturnType,
} from '../../actions/gasless/estimate-gasless';
import type { AppKit } from '../../core/app-kit';
import type { MutationParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type { EstimateGaslessErrorType };

export type EstimateGaslessMutationConfig<context = unknown> = MutationParameter<
    EstimateGaslessData,
    EstimateGaslessErrorType,
    EstimateGaslessVariables,
    context
>;

export const estimateGaslessMutationOptions = <context = unknown>(
    appKit: AppKit,
    config: EstimateGaslessMutationConfig<context> = {},
): EstimateGaslessMutationOptions<context> => {
    return {
        ...config.mutation,
        mutationFn: (variables: EstimateGaslessVariables) => estimateGasless(appKit, variables),
        mutationKey: ['estimateGasless'],
    };
};

export type EstimateGaslessVariables = Compute<EstimateGaslessParameters>;

export type EstimateGaslessData = Compute<Awaited<EstimateGaslessReturnType>>;

export type EstimateGaslessMutate<context = unknown> = (
    variables: EstimateGaslessVariables,
    options?: MutationOptions<EstimateGaslessData, EstimateGaslessErrorType, EstimateGaslessVariables, context>,
) => void;

export type EstimateGaslessMutateAsync<context = unknown> = (
    variables: EstimateGaslessVariables,
    options?: MutationOptions<EstimateGaslessData, EstimateGaslessErrorType, EstimateGaslessVariables, context>,
) => Promise<EstimateGaslessData>;

export type EstimateGaslessMutationOptions<context = unknown> = MutationOptions<
    EstimateGaslessData,
    EstimateGaslessErrorType,
    EstimateGaslessVariables,
    context
>;
